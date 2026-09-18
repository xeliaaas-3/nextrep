import { db } from "../db";
import type { PersonalRecord, SetLog, UUID } from "../types";
import { crearEntidad, marcarBorrado, marcarCambio, soloVivas } from "./base";

/**
 * Records personales.
 *
 * Es un cache derivado de `setLogs`: se puede reconstruir entero en cualquier
 * momento con `rebuildPersonalRecords`. Existe para no recorrer todo el
 * historial en cada render.
 */

/** 1RM estimada con la formula de Epley. */
export function estimar1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export async function getPersonalRecords(userId: UUID): Promise<Map<UUID, PersonalRecord>> {
  const filas = await db.personalRecords.where("userId").equals(userId).toArray();
  const mapa = new Map<UUID, PersonalRecord>();
  for (const fila of soloVivas(filas)) mapa.set(fila.exerciseId, fila);
  return mapa;
}

export async function getPersonalRecord(
  userId: UUID,
  exerciseId: UUID,
): Promise<PersonalRecord | undefined> {
  const filas = await db.personalRecords
    .where("[userId+exerciseId]")
    .equals([userId, exerciseId])
    .toArray();

  return soloVivas(filas)[0];
}

/**
 * Actualiza el record si la serie lo supera. Devuelve `true` cuando ha habido
 * record nuevo, que es lo que dispara el aviso en el modo entrenamiento.
 *
 * Comparamos por 1RM estimada y no por peso bruto: 100 kg x 5 es mejor marca
 * que 105 kg x 1, y contarlo al reves desanimaria en las series de volumen.
 */
export async function upsertRecordIfBetter(userId: UUID, serie: SetLog): Promise<boolean> {
  if (serie.isWarmup || serie.reps <= 0 || serie.weightKg <= 0) return false;

  const nueva1rm = estimar1RM(serie.weightKg, serie.reps);
  const actual = await getPersonalRecord(userId, serie.exerciseId);

  if (!actual) {
    await db.personalRecords.add(
      crearEntidad<PersonalRecord>({
        userId,
        exerciseId: serie.exerciseId,
        weightKg: serie.weightKg,
        reps: serie.reps,
        estimated1rm: nueva1rm,
        achievedAt: serie.completedAt,
      }),
    );
    return true;
  }

  if (nueva1rm <= actual.estimated1rm) return false;

  await db.personalRecords.update(
    actual.id,
    marcarCambio<PersonalRecord>({
      weightKg: serie.weightKg,
      reps: serie.reps,
      estimated1rm: nueva1rm,
      achievedAt: serie.completedAt,
    }),
  );
  return true;
}

/**
 * Reconstruye los records de un usuario a partir de las series. Se usa tras
 * borrar series y como red de seguridad si el cache se desincroniza.
 */
export async function rebuildPersonalRecords(userId: UUID): Promise<void> {
  const series = soloVivas(await db.setLogs.where("userId").equals(userId).toArray()).filter(
    (s) => !s.isWarmup && s.reps > 0 && s.weightKg > 0,
  );

  const mejores = new Map<UUID, SetLog>();
  for (const serie of series) {
    const previa = mejores.get(serie.exerciseId);
    if (!previa || estimar1RM(serie.weightKg, serie.reps) > estimar1RM(previa.weightKg, previa.reps)) {
      mejores.set(serie.exerciseId, serie);
    }
  }

  await db.transaction("rw", db.personalRecords, async () => {
    // Borrado suave tambien aqui: ninguna fila se borra fisicamente, ni
    // siquiera en una tabla derivada, o la Fase 2 no podria propagar la baja.
    const existentes = soloVivas(await db.personalRecords.where("userId").equals(userId).toArray());
    await Promise.all(
      existentes.map((r) => db.personalRecords.update(r.id, marcarBorrado<PersonalRecord>())),
    );

    const nuevos = [...mejores.values()].map((serie) =>
      crearEntidad<PersonalRecord>({
        userId,
        exerciseId: serie.exerciseId,
        weightKg: serie.weightKg,
        reps: serie.reps,
        estimated1rm: estimar1RM(serie.weightKg, serie.reps),
        achievedAt: serie.completedAt,
      }),
    );

    if (nuevos.length > 0) await db.personalRecords.bulkAdd(nuevos);
  });
}
