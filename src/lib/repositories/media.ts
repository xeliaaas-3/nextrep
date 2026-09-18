import { db } from "../db";
import { analizarEnlace } from "../enlaces";
import type { ExerciseMedia, MediaKind, UUID } from "../types";
import { crearEntidad, marcarBorrado, marcarCambio, soloVivas } from "./base";

/**
 * Vídeos e imágenes de referencia de los ejercicios.
 *
 * Todo se guarda como `Blob` en IndexedDB: la referencia de técnica se mira
 * dentro del gimnasio, que es justo donde no hay cobertura.
 */

/** Un vídeo de técnica son unos segundos, no una película. */
export const LIMITE_VIDEO_BYTES = 30 * 1024 * 1024;
export const LIMITE_IMAGEN_BYTES = 8 * 1024 * 1024;

/** Más allá de esto ya no es una referencia rápida entre series. */
export const DURACION_MAXIMA_MS = 60_000;

export class ErrorMedia extends Error {}

export function tipoDeArchivo(mime: string): MediaKind | null {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  return null;
}

export function limitePara(kind: MediaKind): number {
  return kind === "video" ? LIMITE_VIDEO_BYTES : LIMITE_IMAGEN_BYTES;
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

/** La referencia de un ejercicio, si la tiene. */
export async function getMediaForExercise(
  userId: UUID,
  exerciseId: UUID,
): Promise<ExerciseMedia | undefined> {
  const filas = await db.exerciseMedia
    .where("[userId+exerciseId]")
    .equals([userId, exerciseId])
    .toArray();

  // Si hubiera varias, la última manda: sustituir deja la anterior borrada.
  return soloVivas(filas).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Qué ejercicios tienen referencia, para pintar el distintivo en las listas. */
export async function getMediaMapForUser(userId: UUID): Promise<Map<UUID, ExerciseMedia>> {
  const filas = await db.exerciseMedia.where("userId").equals(userId).toArray();
  const mapa = new Map<UUID, ExerciseMedia>();

  for (const fila of soloVivas(filas).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    mapa.set(fila.exerciseId, fila);
  }
  return mapa;
}

export interface EntradaMedia {
  archivo: File | Blob;
  mimeType: string;
  /** Primer fotograma del vídeo, generado en el cliente. */
  posterBlob?: Blob | null;
  durationMs?: number | null;
  notes?: string;
}

/** Deja una sola referencia viva por ejercicio. */
async function reemplazarAnteriores(userId: UUID, exerciseId: UUID, nueva: ExerciseMedia) {
  await db.transaction("rw", db.exerciseMedia, async () => {
    const anteriores = soloVivas(
      await db.exerciseMedia.where("[userId+exerciseId]").equals([userId, exerciseId]).toArray(),
    );
    await Promise.all(
      anteriores.map((m) => db.exerciseMedia.update(m.id, marcarBorrado<ExerciseMedia>())),
    );
    await db.exerciseMedia.add(nueva);
  });
}

/**
 * Guarda un enlace de vídeo de YouTube, Vimeo o un archivo servido
 * directamente.
 *
 * Es la vía rápida: pegar un enlace cuesta dos segundos y no ocupa espacio.
 * A cambio, NECESITA CONEXIÓN para verse, así que quien lo use debe saberlo.
 */
export async function saveLink(
  userId: UUID,
  exerciseId: UUID,
  url: string,
  notes = "",
): Promise<ExerciseMedia> {
  const enlace = analizarEnlace(url);
  if (!enlace) {
    throw new ErrorMedia(
      "No reconozco ese enlace. Vale uno de YouTube, de Vimeo o la dirección de un archivo de vídeo.",
    );
  }

  const media = crearEntidad<ExerciseMedia>({
    userId,
    exerciseId,
    kind: "enlace",
    blob: null,
    url: enlace.urlIncrustada,
    provider: enlace.provider,
    mimeType: "",
    sizeBytes: 0,
    posterBlob: null,
    durationMs: null,
    notes: notes.slice(0, 300),
  });

  await reemplazarAnteriores(userId, exerciseId, media);
  return media;
}

/**
 * Guarda la referencia de un ejercicio y borra la anterior, si la había.
 *
 * Una sola por ejercicio: lo que hace falta entre series es una referencia, no
 * una galería. La tabla admite varias, así que ampliarlo más adelante es quitar
 * este reemplazo y nada más.
 */
export async function saveMedia(
  userId: UUID,
  exerciseId: UUID,
  entrada: EntradaMedia,
): Promise<ExerciseMedia> {
  const kind = tipoDeArchivo(entrada.mimeType);
  if (!kind) {
    throw new ErrorMedia("Solo se admiten vídeos o imágenes.");
  }

  const limite = limitePara(kind);
  if (entrada.archivo.size > limite) {
    throw new ErrorMedia(
      `El archivo pesa ${formatearTamano(entrada.archivo.size)} y el máximo es ${formatearTamano(limite)}.`,
    );
  }

  if (kind === "video" && entrada.durationMs != null && entrada.durationMs > DURACION_MAXIMA_MS) {
    throw new ErrorMedia("El vídeo dura más de un minuto: recorta la parte que te interese.");
  }

  const media = crearEntidad<ExerciseMedia>({
    userId,
    exerciseId,
    kind,
    blob: entrada.archivo,
    url: null,
    provider: null,
    mimeType: entrada.mimeType,
    sizeBytes: entrada.archivo.size,
    posterBlob: entrada.posterBlob ?? null,
    durationMs: entrada.durationMs ?? null,
    notes: entrada.notes?.slice(0, 300) ?? "",
  });

  await reemplazarAnteriores(userId, exerciseId, media);
  return media;
}

export async function updateMediaNotes(id: UUID, notes: string): Promise<void> {
  await db.exerciseMedia.update(id, marcarCambio<ExerciseMedia>({ notes: notes.slice(0, 300) }));
}

export async function deleteMedia(id: UUID): Promise<void> {
  await db.exerciseMedia.update(id, marcarBorrado<ExerciseMedia>());
}

export async function restoreMedia(id: UUID): Promise<void> {
  await db.exerciseMedia.update(id, marcarCambio<ExerciseMedia>({}));
  await db.exerciseMedia.update(id, { deletedAt: null });
}

/**
 * Crea las referencias del catálogo para los ejercicios que aún no tengan
 * ninguna.
 *
 * No pisa nada: si el ejercicio ya tiene referencia —propia o sembrada— se
 * salta. Y como solo mira las vivas, una que hayas borrado a mano NO vuelve
 * sola; para recuperarla hay que pedirlo desde la pantalla "Más".
 *
 * Devuelve cuántas creó.
 */
export async function seedLinksForExercises(
  userId: UUID,
  porNombre: Record<string, string>,
  ejercicios: { id: UUID; name: string }[],
): Promise<number> {
  const existentes = await getMediaMapForUser(userId);

  const nuevas = ejercicios
    .filter((e) => porNombre[e.name] && !existentes.has(e.id))
    .map((e) =>
      crearEntidad<ExerciseMedia>({
        userId,
        exerciseId: e.id,
        kind: "enlace",
        blob: null,
        url: `https://www.youtube-nocookie.com/embed/${porNombre[e.name]}`,
        provider: "youtube",
        mimeType: "",
        sizeBytes: 0,
        posterBlob: null,
        durationMs: null,
        notes: "",
      }),
    );

  if (nuevas.length > 0) await db.exerciseMedia.bulkAdd(nuevas);
  return nuevas.length;
}

/** Cuánto ocupan las referencias, para poder enseñarlo en Ajustes. */
export async function getUsoDeAlmacenamiento(
  userId: UUID,
): Promise<{ elementos: number; bytes: number }> {
  const filas = soloVivas(await db.exerciseMedia.where("userId").equals(userId).toArray());
  return {
    elementos: filas.length,
    bytes: filas.reduce((total, m) => total + m.sizeBytes + (m.posterBlob?.size ?? 0), 0),
  };
}
