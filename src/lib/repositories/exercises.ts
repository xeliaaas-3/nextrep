import { db } from "../db";
import { esquemaEjercicio, type EntradaEjercicio } from "../schemas";
import type { Exercise, MuscleGroup, UUID } from "../types";
import { crearEntidad, marcarBorrado, marcarCambio, soloVivas } from "./base";

/**
 * Catalogo de ejercicios.
 *
 * Es la unica tabla compartida: los ejercicios globales tienen `ownerId: null`
 * y los ve todo el mundo; los que crea un usuario llevan su `userId`. Por eso
 * las consultas filtran por "global O mio", no solo por `userId`.
 */

/** Catalogo visible para un usuario: los globales mas los suyos. */
export async function getExercisesForUser(userId: UUID): Promise<Exercise[]> {
  const filas = await db.exercises
    .filter((e) => e.ownerId === null || e.ownerId === userId)
    .toArray();

  return soloVivas(filas).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function getExerciseById(id: UUID): Promise<Exercise | undefined> {
  const fila = await db.exercises.get(id);
  return fila && fila.deletedAt === null ? fila : undefined;
}

/** Varios ejercicios por id, devueltos como mapa para resolver listas. */
export async function getExercisesByIds(ids: UUID[]): Promise<Map<UUID, Exercise>> {
  if (ids.length === 0) return new Map();
  const filas = await db.exercises.bulkGet([...new Set(ids)]);
  const mapa = new Map<UUID, Exercise>();
  for (const fila of filas) {
    if (fila && fila.deletedAt === null) mapa.set(fila.id, fila);
  }
  return mapa;
}

export async function searchExercises(
  userId: UUID,
  texto: string,
  grupo: MuscleGroup | "todos" = "todos",
): Promise<Exercise[]> {
  const termino = texto.trim().toLowerCase();
  const catalogo = await getExercisesForUser(userId);

  return catalogo.filter((e) => {
    const coincideGrupo = grupo === "todos" || e.muscleGroup === grupo;
    const coincideTexto = termino === "" || e.name.toLowerCase().includes(termino);
    return coincideGrupo && coincideTexto;
  });
}

export async function createCustomExercise(
  userId: UUID,
  entrada: EntradaEjercicio,
): Promise<Exercise> {
  const datos = esquemaEjercicio.parse(entrada);
  const ejercicio = crearEntidad<Exercise>({
    ...datos,
    isCustom: true,
    ownerId: userId,
  });

  await db.exercises.add(ejercicio);
  return ejercicio;
}

export async function updateCustomExercise(
  id: UUID,
  entrada: EntradaEjercicio,
): Promise<void> {
  const datos = esquemaEjercicio.parse(entrada);
  await db.exercises.update(id, marcarCambio<Exercise>(datos));
}

/**
 * Borrado suave. Solo se pueden borrar los ejercicios propios: los globales
 * son catalogo compartido y borrarlos romperia el historial de otros usuarios.
 */
export async function deleteCustomExercise(id: UUID, userId: UUID): Promise<void> {
  const ejercicio = await db.exercises.get(id);
  if (!ejercicio || ejercicio.ownerId !== userId) return;
  await db.exercises.update(id, marcarBorrado<Exercise>());
}

/**
 * Siembra el catalogo global si la tabla esta vacia.
 *
 * La comprobacion y la insercion van dentro de la MISMA transaccion: en
 * desarrollo React monta los efectos dos veces y, si se comprueba fuera, las
 * dos llamadas ven la tabla vacia y el catalogo acaba duplicado.
 */
export async function seedCatalogIfEmpty(ejercicios: Exercise[]): Promise<boolean> {
  return db.transaction("rw", db.exercises, async () => {
    if ((await db.exercises.count()) > 0) return false;
    await db.exercises.bulkAdd(ejercicios);
    return true;
  });
}

export async function countExercises(): Promise<number> {
  return db.exercises.count();
}
