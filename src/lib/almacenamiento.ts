/**
 * Durabilidad del almacenamiento local.
 *
 * IndexedDB sobrevive a cerrar el navegador y a reiniciar el ordenador: no es
 * memoria temporal. Pero por defecto es almacenamiento "best-effort", y el
 * navegador PUEDE borrarlo cuando le falta espacio en disco, sin avisar.
 *
 * `navigator.storage.persist()` pide que se marque como persistente, y
 * entonces solo se borra si lo borras tú. El navegador decide si concederlo:
 * Chrome lo da casi siempre si la app está instalada o la visitas a menudo;
 * Firefox pregunta. Por eso conviene pedirlo y, sobre todo, enseñar el estado
 * en vez de dar por hecho que los datos están a salvo.
 */

export interface EstadoAlmacenamiento {
  soportado: boolean;
  persistente: boolean;
  usadoBytes: number | null;
  cuotaBytes: number | null;
}

export async function consultarAlmacenamiento(): Promise<EstadoAlmacenamiento> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { soportado: false, persistente: false, usadoBytes: null, cuotaBytes: null };
  }

  let persistente = false;
  try {
    persistente = navigator.storage.persisted ? await navigator.storage.persisted() : false;
  } catch {
    // Algunos navegadores lo exponen y lo bloquean; se trata como "no".
  }

  let usadoBytes: number | null = null;
  let cuotaBytes: number | null = null;
  try {
    if (navigator.storage.estimate) {
      const estimacion = await navigator.storage.estimate();
      usadoBytes = estimacion.usage ?? null;
      cuotaBytes = estimacion.quota ?? null;
    }
  } catch {
    // La estimación es informativa: si falla, no pasa nada.
  }

  return { soportado: true, persistente, usadoBytes, cuotaBytes };
}

/**
 * Pide al navegador que no borre los datos. Devuelve si quedó concedido.
 *
 * Conviene llamarlo desde un gesto del usuario: algunos navegadores muestran
 * un permiso, y fuera de un gesto lo deniegan sin preguntar.
 */
export async function pedirAlmacenamientoPersistente(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    if (navigator.storage.persisted && (await navigator.storage.persisted())) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  }
  return `${Math.round((bytes / (1024 * 1024 * 1024)) * 100) / 100} GB`;
}
