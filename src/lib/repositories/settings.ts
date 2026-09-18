import { db } from "../db";
import { esquemaAjustes, type EntradaAjustes } from "../schemas";
import type { UserSettings, UUID } from "../types";
import { crearEntidad, marcarCambio, soloVivas } from "./base";

/**
 * Preferencias del usuario.
 *
 * La lectura y la creación están separadas a propósito: `getSettings` es de
 * solo lectura y puede usarse dentro de una consulta reactiva, mientras que
 * `ensureSettings` escribe y se llama una sola vez al arrancar la app. Dexie
 * no permite abrir una transacción de escritura dentro de un `liveQuery`.
 */

export const AJUSTES_POR_DEFECTO: EntradaAjustes = {
  unit: "kg",
  defaultRestSeconds: 120,
  // Modo oscuro por defecto: la app se usa en un gimnasio, con poca luz.
  theme: "dark",
};

/** Solo lectura. Devuelve `undefined` la primera vez, antes del arranque. */
export async function getSettings(userId: UUID): Promise<UserSettings | undefined> {
  const filas = await db.userSettings.where("userId").equals(userId).toArray();
  return soloVivas(filas)[0];
}

/** Crea la fila de ajustes si aún no existe. Solo desde el arranque. */
export async function ensureSettings(userId: UUID): Promise<UserSettings> {
  const existente = await getSettings(userId);
  if (existente) return existente;

  const ajustes = crearEntidad<UserSettings>({
    userId,
    ...AJUSTES_POR_DEFECTO,
    lastSyncedAt: null,
  });

  await db.userSettings.add(ajustes);
  return ajustes;
}

export async function updateSettings(userId: UUID, entrada: EntradaAjustes): Promise<void> {
  const datos = esquemaAjustes.parse(entrada);
  const ajustes = await ensureSettings(userId);
  await db.userSettings.update(ajustes.id, marcarCambio<UserSettings>(datos));
}
