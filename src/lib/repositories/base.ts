import { nuevoId } from "../ids";
import { ahora } from "../time";
import type { BaseEntity, CamposGestionados, ISODate } from "../types";

/**
 * Utilidades comunes a todos los repositorios.
 *
 * Los repositorios son los unicos responsables de asignar `id`, `createdAt`,
 * `updatedAt` y `deletedAt`. Quien llama nunca los pasa a mano: asi ninguna
 * escritura puede quedarse sin los metadatos que necesita la sincronizacion.
 */

/** Datos de una entidad sin los campos que gestiona el repositorio. */
export type SinMetadatos<T extends BaseEntity> = Omit<T, CamposGestionados>;

/** Completa una entidad nueva con id y timestamps. */
export function crearEntidad<T extends BaseEntity>(datos: SinMetadatos<T>): T {
  const momento = ahora();
  return {
    ...datos,
    id: nuevoId(),
    createdAt: momento,
    updatedAt: momento,
    deletedAt: null,
  } as T;
}

/** Cambios de una modificacion, con `updatedAt` refrescado. */
export function marcarCambio<T extends BaseEntity>(
  cambios: Partial<SinMetadatos<T>>,
): Partial<T> {
  return { ...cambios, updatedAt: ahora() } as Partial<T>;
}

/** Cambios de un borrado suave. Nunca borramos filas fisicamente. */
export function marcarBorrado<T extends BaseEntity>(): Partial<T> {
  const momento = ahora();
  return { updatedAt: momento, deletedAt: momento } as Partial<T>;
}

/** Cambios para deshacer un borrado suave. */
export function marcarRestaurado<T extends BaseEntity>(): Partial<T> {
  return { updatedAt: ahora(), deletedAt: null } as Partial<T>;
}

/** `true` si la fila esta viva. Todo listado debe filtrar con esto. */
export function estaViva<T extends BaseEntity>(fila: T): boolean {
  return fila.deletedAt === null;
}

export function soloVivas<T extends BaseEntity>(filas: T[]): T[] {
  return filas.filter(estaViva);
}

/** Orden ascendente estable por un campo numerico. */
export function porOrden<T extends { sortOrder: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

/** Orden descendente por fecha (lo mas reciente primero). */
export function porFechaDesc(a: ISODate, b: ISODate): number {
  return b.localeCompare(a);
}
