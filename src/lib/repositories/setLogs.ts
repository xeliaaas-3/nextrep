import { db } from "../db";
import { esquemaSerie, type EntradaSerie } from "../schemas";
import { ahora } from "../time";
import type { ISODate, SetLog, UUID } from "../types";
import { crearEntidad, marcarBorrado, marcarCambio, soloVivas } from "./base";

/** Series ejecutadas. Es la tabla que mas escribe la app. */

export async function getSetLogsBySession(sessionId: UUID): Promise<SetLog[]> {
  const filas = await db.setLogs.where("sessionId").equals(sessionId).toArray();
  return soloVivas(filas).sort(
    (a, b) => a.exerciseId.localeCompare(b.exerciseId) || a.setNumber - b.setNumber,
  );
}

/** Series de la sesion agrupadas por ejercicio. */
export async function getSetLogsBySessionGrouped(
  sessionId: UUID,
): Promise<Map<UUID, SetLog[]>> {
  const series = await getSetLogsBySession(sessionId);
  const mapa = new Map<UUID, SetLog[]>();
  for (const serie of series) {
    const lista = mapa.get(serie.exerciseId);
    if (lista) lista.push(serie);
    else mapa.set(serie.exerciseId, [serie]);
  }
  for (const lista of mapa.values()) lista.sort((a, b) => a.setNumber - b.setNumber);
  return mapa;
}

/** Registra una serie. Es la escritura del boton principal del entrenamiento. */
export async function logSet(userId: UUID, entrada: EntradaSerie): Promise<SetLog> {
  const datos = esquemaSerie.parse(entrada);
  const serie = crearEntidad<SetLog>({
    ...datos,
    userId,
    completedAt: ahora(),
  });

  await db.setLogs.add(serie);
  return serie;
}

export async function updateSetLog(
  id: UUID,
  cambios: Partial<Pick<SetLog, "weightKg" | "reps" | "rpe" | "isWarmup">>,
): Promise<void> {
  await db.setLogs.update(id, marcarCambio<SetLog>(cambios));
}

export async function deleteSetLog(id: UUID): Promise<void> {
  await db.setLogs.update(id, marcarBorrado<SetLog>());
}

/** Deshacer el borrado de una serie. */
export async function restoreSetLog(id: UUID): Promise<void> {
  await db.setLogs.update(id, { updatedAt: ahora(), deletedAt: null });
}

export interface RendimientoPrevio {
  sessionId: UUID;
  fecha: ISODate;
  series: SetLog[];
}

/**
 * Que se hizo la ultima vez con este ejercicio, excluyendo la sesion actual.
 *
 * Es el dato que precarga el modo entrenamiento y del que parte la sugerencia
 * de progresion.
 */
export async function getLastPerformance(
  userId: UUID,
  exerciseId: UUID,
  excluirSessionId?: UUID,
): Promise<RendimientoPrevio | null> {
  const filas = await db.setLogs.where("exerciseId").equals(exerciseId).toArray();

  const candidatas = soloVivas(filas)
    .filter((s) => s.userId === userId && !s.isWarmup && s.sessionId !== excluirSessionId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const ultima = candidatas[0];
  if (!ultima) return null;

  const series = candidatas
    .filter((s) => s.sessionId === ultima.sessionId)
    .sort((a, b) => a.setNumber - b.setNumber);

  return { sessionId: ultima.sessionId, fecha: ultima.completedAt, series };
}

/**
 * Las ultimas `n` sesiones en las que aparece el ejercicio, de la mas reciente
 * a la mas antigua. La progresion necesita dos para detectar un estancamiento.
 */
export async function getRecentPerformances(
  userId: UUID,
  exerciseId: UUID,
  n: number,
  excluirSessionId?: UUID,
): Promise<RendimientoPrevio[]> {
  const filas = await db.setLogs.where("exerciseId").equals(exerciseId).toArray();

  const efectivas = soloVivas(filas)
    .filter((s) => s.userId === userId && !s.isWarmup && s.sessionId !== excluirSessionId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const porSesion = new Map<UUID, SetLog[]>();
  for (const serie of efectivas) {
    const lista = porSesion.get(serie.sessionId);
    if (lista) lista.push(serie);
    else porSesion.set(serie.sessionId, [serie]);
  }

  return [...porSesion.entries()].slice(0, n).map(([sessionId, series]) => ({
    sessionId,
    fecha: series[0].completedAt,
    series: [...series].sort((a, b) => a.setNumber - b.setNumber),
  }));
}

/** Todas las series efectivas de un ejercicio, para la grafica de progreso. */
export async function getExerciseHistory(userId: UUID, exerciseId: UUID): Promise<SetLog[]> {
  const filas = await db.setLogs.where("exerciseId").equals(exerciseId).toArray();
  return soloVivas(filas)
    .filter((s) => s.userId === userId && !s.isWarmup)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

/** Series de un rango de fechas, para calcular el volumen semanal. */
export async function getSetLogsBetween(
  userId: UUID,
  desde: Date,
  hasta: Date,
): Promise<SetLog[]> {
  const filas = await db.setLogs.where("userId").equals(userId).toArray();
  const min = desde.toISOString();
  const max = hasta.toISOString();

  return soloVivas(filas).filter(
    (s) => !s.isWarmup && s.completedAt >= min && s.completedAt <= max,
  );
}

/** Ids de los ejercicios que el usuario ha entrenado alguna vez. */
export async function getTrainedExerciseIds(userId: UUID): Promise<UUID[]> {
  const filas = await db.setLogs.where("userId").equals(userId).toArray();
  return [...new Set(soloVivas(filas).map((s) => s.exerciseId))];
}
