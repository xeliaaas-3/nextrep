import { db } from "../db";
import { ahora } from "../time";
import type { SetLog, UUID, WorkoutSession } from "../types";
import { crearEntidad, marcarBorrado, marcarCambio, soloVivas } from "./base";

/**
 * Sesiones de entrenamiento.
 *
 * Una sesion con `finishedAt: null` es la sesion en curso. Se persiste en
 * cuanto empieza, no al terminar: por eso el entrenamiento sobrevive a que se
 * cierre o recargue el navegador.
 */

/** La sesion abierta del usuario, si la hay. Solo puede haber una. */
export async function getActiveSession(userId: UUID): Promise<WorkoutSession | undefined> {
  const filas = await db.workoutSessions.where("userId").equals(userId).toArray();
  return soloVivas(filas)
    .filter((s) => s.finishedAt === null)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

export async function getSessionById(
  id: UUID,
  userId: UUID,
): Promise<WorkoutSession | undefined> {
  const fila = await db.workoutSessions.get(id);
  if (!fila || fila.deletedAt !== null || fila.userId !== userId) return undefined;
  return fila;
}

/**
 * Empieza una sesion. Si ya habia una abierta la devuelve en lugar de crear
 * otra, para que no puedan quedar dos entrenamientos en curso a la vez.
 */
export async function startSession(
  userId: UUID,
  routineId: UUID | null,
): Promise<WorkoutSession> {
  const abierta = await getActiveSession(userId);
  if (abierta) return abierta;

  const sesion = crearEntidad<WorkoutSession>({
    userId,
    routineId,
    startedAt: ahora(),
    finishedAt: null,
    notes: "",
  });

  await db.workoutSessions.add(sesion);
  return sesion;
}

export async function finishSession(id: UUID): Promise<void> {
  await db.workoutSessions.update(id, marcarCambio<WorkoutSession>({ finishedAt: ahora() }));
}

/** Reabre una sesion terminada (deshacer del boton de finalizar). */
export async function reopenSession(id: UUID): Promise<void> {
  await db.workoutSessions.update(id, marcarCambio<WorkoutSession>({ finishedAt: null }));
}

export async function updateSessionNotes(id: UUID, notes: string): Promise<void> {
  await db.workoutSessions.update(id, marcarCambio<WorkoutSession>({ notes: notes.slice(0, 500) }));
}

/** Descarta una sesion y sus series. Borrado suave en ambas tablas. */
export async function discardSession(id: UUID): Promise<void> {
  await db.transaction("rw", db.workoutSessions, db.setLogs, async () => {
    await db.workoutSessions.update(id, marcarBorrado<WorkoutSession>());
    const series = await db.setLogs.where("sessionId").equals(id).toArray();
    await Promise.all(soloVivas(series).map((s) => db.setLogs.update(s.id, marcarBorrado<SetLog>())));
  });
}

/** Sesiones terminadas, de la mas reciente a la mas antigua. */
export async function getFinishedSessions(userId: UUID, limite?: number): Promise<WorkoutSession[]> {
  const filas = await db.workoutSessions.where("userId").equals(userId).toArray();
  const terminadas = soloVivas(filas)
    .filter((s) => s.finishedAt !== null)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return limite === undefined ? terminadas : terminadas.slice(0, limite);
}

/** Sesiones terminadas dentro de un rango, para el calendario semanal. */
export async function getSessionsBetween(
  userId: UUID,
  desde: Date,
  hasta: Date,
): Promise<WorkoutSession[]> {
  const filas = await db.workoutSessions
    .where("[userId+startedAt]")
    .between([userId, desde.toISOString()], [userId, hasta.toISOString()])
    .toArray();

  return soloVivas(filas).filter((s) => s.finishedAt !== null);
}

/**
 * Siguiente rutina de la rotacion: la que sigue por `sortOrder` a la ultima
 * que se entreno. Con esto sabemos "que toca hoy" sin fijar dias de la semana,
 * que es como funciona de verdad una rotacion push / pull / pierna.
 */
export async function getNextRoutineIdInRotation(
  userId: UUID,
  rutinasEnOrden: UUID[],
): Promise<UUID | null> {
  if (rutinasEnOrden.length === 0) return null;

  const recientes = await getFinishedSessions(userId, 20);
  const ultima = recientes.find((s) => s.routineId !== null && rutinasEnOrden.includes(s.routineId));
  if (!ultima || ultima.routineId === null) return rutinasEnOrden[0];

  const indice = rutinasEnOrden.indexOf(ultima.routineId);
  return rutinasEnOrden[(indice + 1) % rutinasEnOrden.length];
}
