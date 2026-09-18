import Dexie, { type EntityTable } from "dexie";
import type {
  Exercise,
  ExerciseMedia,
  PersonalRecord,
  Routine,
  RoutineExercise,
  SetLog,
  UserSettings,
  WorkoutSession,
} from "./types";

/**
 * Base local (IndexedDB). Es la FUENTE DE VERDAD de la aplicacion: la app
 * funciona al 100% sin conexion y la nube de la Fase 2 sera unicamente
 * respaldo y sincronizacion.
 *
 * Solo los repositorios de `src/lib/repositories` pueden importar este modulo.
 * Los componentes de React nunca lo hacen.
 *
 * Indices: cada tabla personal declara `[userId+updatedAt]`, que es la consulta
 * exacta que hara el sincronizador de la Fase 2 ("dame lo que cambio despues
 * de `lastSyncedAt` para este usuario").
 */
class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  routines!: EntityTable<Routine, "id">;
  routineExercises!: EntityTable<RoutineExercise, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  setLogs!: EntityTable<SetLog, "id">;
  personalRecords!: EntityTable<PersonalRecord, "id">;
  userSettings!: EntityTable<UserSettings, "id">;
  exerciseMedia!: EntityTable<ExerciseMedia, "id">;

  constructor() {
    super("gym");

    // Version 1. Las migraciones futuras se anaden como `.version(2)` sin
    // borrar esta declaracion.
    this.version(1).stores({
      exercises: "id, name, muscleGroup, equipment, ownerId, updatedAt, [ownerId+updatedAt]",
      routines: "id, userId, updatedAt, [userId+updatedAt], [userId+sortOrder]",
      routineExercises:
        "id, userId, routineId, exerciseId, updatedAt, [userId+updatedAt], [routineId+sortOrder]",
      workoutSessions:
        "id, userId, routineId, startedAt, finishedAt, updatedAt, [userId+updatedAt], [userId+startedAt]",
      setLogs:
        "id, userId, sessionId, exerciseId, completedAt, updatedAt, [userId+updatedAt], [sessionId+exerciseId], [exerciseId+completedAt]",
      personalRecords: "id, userId, exerciseId, updatedAt, [userId+updatedAt], [userId+exerciseId]",
      userSettings: "id, userId, updatedAt, [userId+updatedAt]",
    });

    // Version 2: vídeos e imágenes de referencia por ejercicio. Añadir una
    // tabla no toca las anteriores, así que no hace falta migrar datos.
    this.version(2).stores({
      exerciseMedia:
        "id, userId, exerciseId, updatedAt, [userId+updatedAt], [userId+exerciseId]",
    });
  }
}

export const db = new GymDB();
