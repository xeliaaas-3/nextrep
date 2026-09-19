import { db } from "../db";
import type { UUID } from "../types";

/**
 * Copia de seguridad del registro de entrenamiento.
 *
 * Aunque el almacenamiento sea persistente, sigue viviendo en un solo
 * navegador de un solo dispositivo: si lo formateas, borras los datos del
 * sitio o cambias de móvil, no hay vuelta atrás. Hasta que llegue la
 * sincronización de la Fase 2, un archivo que puedas guardar donde quieras es
 * la única red de seguridad real.
 *
 * Qué entra: rutinas, sesiones, series, récords, ajustes, tus ejercicios y los
 * ENLACES de referencia. Qué no: los vídeos e imágenes que hayas grabado tú.
 * Un vídeo de 30 MB convertido a texto se pone en 40, y con unos pocos el
 * archivo deja de ser manejable; esos se quedan en el dispositivo.
 */

export const VERSION_RESPALDO = 1;

export interface Respaldo {
  formato: "nextrep";
  version: number;
  exportadoEn: string;
  usuario: UUID;
  tablas: Record<string, unknown[]>;
}

/** Tablas que viajan en la copia, en orden de dependencia. */
const TABLAS = [
  "exercises",
  "routines",
  "routineExercises",
  "workoutSessions",
  "setLogs",
  "personalRecords",
  "userSettings",
  "exerciseMedia",
] as const;

export async function exportarRespaldo(userId: UUID): Promise<Respaldo> {
  const tablas: Record<string, unknown[]> = {};

  for (const nombre of TABLAS) {
    const tabla = db.table(nombre);
    const filas = await tabla.toArray();

    if (nombre === "exercises") {
      // Del catálogo global no hace falta copia: se siembra solo. Solo van
      // los ejercicios que haya creado el usuario.
      tablas[nombre] = filas.filter((f) => (f as { ownerId?: UUID }).ownerId === userId);
      continue;
    }

    const propias = filas.filter((f) => (f as { userId?: UUID }).userId === userId);

    if (nombre === "exerciseMedia") {
      // Los archivos no viajan; los enlaces sí, que no ocupan nada.
      tablas[nombre] = propias
        .filter((f) => (f as { kind?: string }).kind === "enlace")
        .map((f) => ({ ...(f as object), blob: null, posterBlob: null }));
      continue;
    }

    tablas[nombre] = propias;
  }

  return {
    formato: "nextrep",
    version: VERSION_RESPALDO,
    exportadoEn: new Date().toISOString(),
    usuario: userId,
    tablas,
  };
}

export class ErrorRespaldo extends Error {}

export interface ResultadoImportacion {
  anadidas: number;
  actualizadas: number;
  omitidas: number;
}

/**
 * Funde una copia con lo que ya hay.
 *
 * No borra nada y resuelve los choques por `updatedAt`: gana la versión más
 * reciente. Es la misma regla que usará el sincronizador de la Fase 2, así que
 * importar dos veces el mismo archivo no duplica nada.
 */
export async function importarRespaldo(
  userId: UUID,
  crudo: unknown,
): Promise<ResultadoImportacion> {
  const respaldo = crudo as Partial<Respaldo>;

  if (!respaldo || respaldo.formato !== "nextrep" || typeof respaldo.tablas !== "object") {
    throw new ErrorRespaldo("Ese archivo no es una copia de NextRep.");
  }
  if ((respaldo.version ?? 0) > VERSION_RESPALDO) {
    throw new ErrorRespaldo(
      "La copia se hizo con una versión más nueva de la app. Actualízala antes de importar.",
    );
  }

  const resultado: ResultadoImportacion = { anadidas: 0, actualizadas: 0, omitidas: 0 };

  for (const nombre of TABLAS) {
    const filas = respaldo.tablas?.[nombre];
    if (!Array.isArray(filas) || filas.length === 0) continue;

    const tabla = db.table(nombre);

    await db.transaction("rw", tabla, async () => {
      for (const fila of filas as Record<string, unknown>[]) {
        const id = fila.id;
        if (typeof id !== "string" || typeof fila.updatedAt !== "string") {
          resultado.omitidas += 1;
          continue;
        }

        // Todo lo importado pasa a ser de quien importa: así una copia traída
        // de otro dispositivo es utilizable desde el primer momento.
        const entrante = { ...fila, ...(nombre === "exercises" ? { ownerId: userId } : { userId }) };

        const existente = (await tabla.get(id)) as { updatedAt?: string } | undefined;

        if (!existente) {
          await tabla.add(entrante);
          resultado.anadidas += 1;
        } else if ((existente.updatedAt ?? "") < (fila.updatedAt as string)) {
          await tabla.put(entrante);
          resultado.actualizadas += 1;
        } else {
          resultado.omitidas += 1;
        }
      }
    });
  }

  return resultado;
}

/** Nombre de archivo con la fecha, para no acabar con diez "respaldo.json". */
export function nombreDeArchivo(): string {
  const hoy = new Date();
  const fecha = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");
  return `nextrep-${fecha}.json`;
}
