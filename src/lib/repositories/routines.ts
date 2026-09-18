import { db } from "../db";
import {
  esquemaRutina,
  esquemaRutinaEjercicio,
  type EntradaRutina,
  type EntradaRutinaEjercicio,
} from "../schemas";
import type { Routine, RoutineExercise, UUID } from "../types";
import { crearEntidad, marcarBorrado, marcarCambio, porOrden, soloVivas } from "./base";

/** Rutinas y los ejercicios que las componen. */

export async function getRoutinesByUser(userId: UUID): Promise<Routine[]> {
  const filas = await db.routines.where("userId").equals(userId).toArray();
  return soloVivas(filas)
    .filter((r) => !r.isArchived)
    .sort(porOrden);
}

export async function getArchivedRoutines(userId: UUID): Promise<Routine[]> {
  const filas = await db.routines.where("userId").equals(userId).toArray();
  return soloVivas(filas)
    .filter((r) => r.isArchived)
    .sort(porOrden);
}

export async function getRoutineById(id: UUID, userId: UUID): Promise<Routine | undefined> {
  const fila = await db.routines.get(id);
  if (!fila || fila.deletedAt !== null || fila.userId !== userId) return undefined;
  return fila;
}

export async function createRoutine(userId: UUID, entrada: EntradaRutina): Promise<Routine> {
  const datos = esquemaRutina.parse(entrada);
  const existentes = await getRoutinesByUser(userId);
  const siguienteOrden = existentes.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1;

  const rutina = crearEntidad<Routine>({
    ...datos,
    userId,
    sortOrder: siguienteOrden,
    isArchived: false,
  });

  await db.routines.add(rutina);
  return rutina;
}

export async function updateRoutine(id: UUID, entrada: EntradaRutina): Promise<void> {
  const datos = esquemaRutina.parse(entrada);
  await db.routines.update(id, marcarCambio<Routine>(datos));
}

export async function setRoutineArchived(id: UUID, isArchived: boolean): Promise<void> {
  await db.routines.update(id, marcarCambio<Routine>({ isArchived }));
}

/** Reordena las rutinas segun el orden recibido. */
export async function reorderRoutines(idsEnOrden: UUID[]): Promise<void> {
  await db.transaction("rw", db.routines, async () => {
    await Promise.all(
      idsEnOrden.map((id, indice) =>
        db.routines.update(id, marcarCambio<Routine>({ sortOrder: indice })),
      ),
    );
  });
}

/**
 * Borrado suave de la rutina y, en la misma transaccion, de sus ejercicios.
 * Las sesiones ya entrenadas NO se tocan: el historial es inmutable.
 */
export async function deleteRoutine(id: UUID): Promise<void> {
  await db.transaction("rw", db.routines, db.routineExercises, async () => {
    await db.routines.update(id, marcarBorrado<Routine>());
    const hijos = await db.routineExercises.where("routineId").equals(id).toArray();
    await Promise.all(
      soloVivas(hijos).map((re) =>
        db.routineExercises.update(re.id, marcarBorrado<RoutineExercise>()),
      ),
    );
  });
}

export async function getRoutineExercises(routineId: UUID): Promise<RoutineExercise[]> {
  const filas = await db.routineExercises.where("routineId").equals(routineId).toArray();
  return soloVivas(filas).sort(porOrden);
}

export async function addExerciseToRoutine(
  routineId: UUID,
  userId: UUID,
  entrada: EntradaRutinaEjercicio,
): Promise<RoutineExercise> {
  const datos = esquemaRutinaEjercicio.parse(entrada);
  const existentes = await getRoutineExercises(routineId);
  const siguienteOrden = existentes.reduce((max, e) => Math.max(max, e.sortOrder), -1) + 1;

  const fila = crearEntidad<RoutineExercise>({
    ...datos,
    routineId,
    userId,
    sortOrder: siguienteOrden,
  });

  await db.routineExercises.add(fila);
  return fila;
}

export async function updateRoutineExercise(
  id: UUID,
  entrada: EntradaRutinaEjercicio,
): Promise<void> {
  const datos = esquemaRutinaEjercicio.parse(entrada);
  await db.routineExercises.update(id, marcarCambio<RoutineExercise>(datos));
}

export async function removeExerciseFromRoutine(id: UUID): Promise<void> {
  await db.routineExercises.update(id, marcarBorrado<RoutineExercise>());
}

export async function reorderRoutineExercises(idsEnOrden: UUID[]): Promise<void> {
  await db.transaction("rw", db.routineExercises, async () => {
    await Promise.all(
      idsEnOrden.map((id, indice) =>
        db.routineExercises.update(id, marcarCambio<RoutineExercise>({ sortOrder: indice })),
      ),
    );
  });
}

/** Cuantos ejercicios tiene cada rutina, para pintar las listas. */
export async function countExercisesByRoutine(userId: UUID): Promise<Map<UUID, number>> {
  const filas = await db.routineExercises.where("userId").equals(userId).toArray();
  const conteo = new Map<UUID, number>();
  for (const fila of soloVivas(filas)) {
    conteo.set(fila.routineId, (conteo.get(fila.routineId) ?? 0) + 1);
  }
  return conteo;
}
