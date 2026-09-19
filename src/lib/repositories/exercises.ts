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

export interface ResultadoCatalogo {
  /** Los que no existian y se acaban de crear. */
  anadidos: Exercise[];
  /** Cuantos ya existian pero tenian datos desactualizados. */
  actualizados: number;
}

/**
 * Pone el catalogo global al dia, sin borrar nada.
 *
 * No basta con sembrar cuando la tabla esta vacia: quien ya tenia la app
 * instalada nunca veria los ejercicios que se anadan despues. Aqui se comparan
 * por nombre y se crean solo los que faltan, asi que al actualizar la app el
 * catalogo crece solo y sin duplicados.
 *
 * Tambien corrige los que existan con datos viejos —por ejemplo la plancha,
 * que estaba como ejercicio de repeticiones y se mide en segundos—, pero solo
 * en las filas globales: los ejercicios que haya creado el usuario no se tocan.
 *
 * Todo dentro de una transaccion: en desarrollo React monta los efectos dos
 * veces y, si se comprueba fuera, las dos llamadas ven la tabla vacia y el
 * catalogo acaba duplicado.
 */
export async function syncCatalog(ejercicios: Exercise[]): Promise<ResultadoCatalogo> {
  return db.transaction("rw", db.exercises, async () => {
    const existentes = await db.exercises.filter((e) => e.ownerId === null).toArray();
    const porNombre = new Map(existentes.map((e) => [e.name, e]));

    const anadidos: Exercise[] = [];
    const cambios: { id: UUID; datos: Partial<Exercise> }[] = [];

    for (const definicion of ejercicios) {
      const actual = porNombre.get(definicion.name);

      if (!actual) {
        anadidos.push(definicion);
        continue;
      }

      const desactualizado =
        actual.muscleGroup !== definicion.muscleGroup ||
        actual.equipment !== definicion.equipment ||
        (actual.tracking ?? "reps") !== (definicion.tracking ?? "reps");

      if (desactualizado) {
        cambios.push({
          id: actual.id,
          datos: marcarCambio<Exercise>({
            muscleGroup: definicion.muscleGroup,
            equipment: definicion.equipment,
            tracking: definicion.tracking,
          }),
        });
      }
    }

    if (anadidos.length > 0) await db.exercises.bulkAdd(anadidos);
    await Promise.all(cambios.map(({ id, datos }) => db.exercises.update(id, datos)));

    return { anadidos, actualizados: cambios.length };
  });
}

export async function countExercises(): Promise<number> {
  return db.exercises.count();
}
