/**
 * Punto de entrada unico de la capa de datos.
 *
 * Los componentes importan SIEMPRE desde aqui (`@/lib/repositories`) y nunca
 * desde `@/lib/db`. Cuando en la Fase 2 cada repositorio empiece a sincronizar
 * contra Supabase, ningun componente cambiara.
 */

export * as ejercicios from "./exercises";
export * as rutinas from "./routines";
export * as sesiones from "./sessions";
export * as series from "./setLogs";
export * as records from "./personalRecords";
export * as ajustes from "./settings";
export * as estadisticas from "./stats";
export * as media from "./media";
export * as respaldo from "./respaldo";

export type { RendimientoPrevio } from "./setLogs";
export type { VolumenPorGrupo, ResumenSesion } from "./stats";
