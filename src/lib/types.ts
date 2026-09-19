/**
 * Tipos del dominio.
 *
 * Toda entidad persistida extiende `BaseEntity`: identificador UUID generado en
 * el cliente y los tres timestamps que hacen posible la sincronizacion de la
 * Fase 2 (`createdAt`, `updatedAt`, `deletedAt`).
 */

export type UUID = string;

/** Timestamp ISO 8601 en UTC. */
export type ISODate = string;

export interface BaseEntity {
  id: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Borrado suave. `null` significa que la fila esta viva. */
  deletedAt: ISODate | null;
}

/**
 * Categorías del catálogo.
 *
 * No todas son grupos musculares —`cardio`, `movilidad` y `estiramiento` no lo
 * son— pero sí son la dimensión por la que se busca y se filtra, que es para
 * lo que sirve el campo. Van al final para que el trabajo de fuerza siga
 * apareciendo primero en los filtros.
 */
export const GRUPOS_MUSCULARES = [
  "pecho",
  "espalda",
  "piernas",
  "hombros",
  "biceps",
  "triceps",
  "core",
  "cardio",
  "movilidad",
  "estiramiento",
] as const;

export type MuscleGroup = (typeof GRUPOS_MUSCULARES)[number];

export const EQUIPOS = [
  "barra",
  "mancuerna",
  "maquina",
  "polea",
  "banda",
  "peso_corporal",
] as const;

export type Equipment = (typeof EQUIPOS)[number];

/**
 * Cómo se mide una serie de este ejercicio.
 *
 * Un estiramiento o una plancha se cuentan en segundos, no en repeticiones.
 * Guardarlo en el ejercicio y no en cada serie evita tener que decidirlo una y
 * otra vez, y permite que la interfaz ponga la etiqueta correcta.
 */
export type Medicion = "reps" | "tiempo";

/** Catalogo de ejercicios. Compartido, no es una tabla personal. */
export interface Exercise extends BaseEntity {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  /** `undefined` en filas antiguas: se trata como "reps". */
  tracking?: Medicion;
  isCustom: boolean;
  /** `null` para el catalogo global; el `userId` si lo creo el usuario. */
  ownerId: UUID | null;
}

export interface Routine extends BaseEntity {
  userId: UUID;
  name: string;
  description: string;
  sortOrder: number;
  isArchived: boolean;
}

export interface RoutineExercise extends BaseEntity {
  routineId: UUID;
  /** Denormalizado desde la rutina: ver `docs/DECISIONES.md`. */
  userId: UUID;
  exerciseId: UUID;
  sortOrder: number;
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  notes: string;
}

export interface WorkoutSession extends BaseEntity {
  userId: UUID;
  /** `null` en una sesion libre, sin rutina de referencia. */
  routineId: UUID | null;
  startedAt: ISODate;
  /** `null` mientras la sesion sigue en curso. */
  finishedAt: ISODate | null;
  notes: string;
}

export interface SetLog extends BaseEntity {
  sessionId: UUID;
  /** Denormalizado desde la sesion: ver `docs/DECISIONES.md`. */
  userId: UUID;
  exerciseId: UUID;
  setNumber: number;
  /** Siempre en kilogramos. La conversion a libras es solo de presentacion. */
  weightKg: number;
  reps: number;
  /** Esfuerzo percibido 1-10. Siempre opcional. */
  rpe: number | null;
  isWarmup: boolean;
  completedAt: ISODate;
}

/** Cache derivado de `setLogs` para no recalcular los records en cada render. */
export interface PersonalRecord extends BaseEntity {
  userId: UUID;
  exerciseId: UUID;
  weightKg: number;
  reps: number;
  estimated1rm: number;
  achievedAt: ISODate;
}

export type MediaKind = "video" | "image" | "enlace";

/** Plataformas cuyo reproductor se puede incrustar con seguridad. */
export type ProveedorVideo = "youtube" | "vimeo" | "directo";

/**
 * Vídeo corto o imagen de referencia de un ejercicio.
 *
 * Hay dos formas de guardarla, y la diferencia importa:
 *
 * - `video` / `image`: el archivo vive como `Blob` DENTRO de IndexedDB. Se ve
 *   en el sótano del gimnasio, sin cobertura, que es donde de verdad hace
 *   falta consultar la técnica.
 * - `enlace`: solo se guarda la URL de YouTube, Vimeo o un vídeo directo. Pesa
 *   nada y se añade en dos segundos, pero NECESITA CONEXIÓN. La interfaz lo
 *   dice sin rodeos para que nadie cuente con ello y se lo encuentre en blanco.
 *
 * Es una tabla personal como cualquier otra: `userId`, UUID y los tres
 * timestamps, para que en la Fase 2 sincronice igual que el resto.
 */
export interface ExerciseMedia extends BaseEntity {
  userId: UUID;
  exerciseId: UUID;
  kind: MediaKind;
  /** Solo en archivos locales. */
  blob: Blob | null;
  /** Solo en enlaces. */
  url: string | null;
  provider: ProveedorVideo | null;
  mimeType: string;
  sizeBytes: number;
  /** Primer fotograma del vídeo, para pintar la miniatura sin descodificarlo. */
  posterBlob: Blob | null;
  durationMs: number | null;
  /** Recordatorio de técnica escrito por el usuario. */
  notes: string;
}

export type Unit = "kg" | "lb";
export type Theme = "dark" | "light";

export interface UserSettings extends BaseEntity {
  userId: UUID;
  unit: Unit;
  defaultRestSeconds: number;
  theme: Theme;
  lastSyncedAt: ISODate | null;
}

/** Campos que gestiona el repositorio, nunca quien lo llama. */
export type CamposGestionados = "id" | "createdAt" | "updatedAt" | "deletedAt";
