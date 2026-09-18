"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import * as almacen from "./almacenLocal";
import { getCurrentUserId } from "./auth";
import * as repoAjustes from "./repositories/settings";
import { AJUSTES_POR_DEFECTO } from "./repositories/settings";
import type { Theme, Unit, UUID } from "./types";

/**
 * Enlace entre React y la capa de datos.
 *
 * Este es el único módulo de la app que sabe que existe Dexie por debajo: los
 * componentes usan `useDatos` y no importan nada de la base.
 */

/**
 * Suscribe un componente a una consulta de repositorio. Se vuelve a ejecutar
 * sola cuando cambian los datos implicados, sin refrescar a mano.
 */
export function useDatos<T>(consulta: () => Promise<T>, dependencias: unknown[] = []): T | undefined {
  return useLiveQuery(consulta, dependencias);
}

/** Igual que `useDatos`, pero con un valor mientras carga. */
export function useDatosCon<T>(
  consulta: () => Promise<T>,
  porDefecto: T,
  dependencias: unknown[] = [],
): T {
  return useLiveQuery(consulta, dependencias, porDefecto);
}

export function useUsuarioActual(): UUID {
  return getCurrentUserId();
}

export interface AjustesEnUso {
  unit: Unit;
  defaultRestSeconds: number;
  theme: Theme;
}

/** Ajustes del usuario, con los valores por defecto mientras cargan. */
export function useAjustes(): AjustesEnUso {
  const userId = useUsuarioActual();
  const guardados = useDatos(() => repoAjustes.getSettings(userId), [userId]);

  if (!guardados) return AJUSTES_POR_DEFECTO;
  return {
    unit: guardados.unit,
    defaultRestSeconds: guardados.defaultRestSeconds,
    theme: guardados.theme,
  };
}

/** Marca de tiempo que avanza sola, para cronómetros y contadores. */
export function useTicker(activo: boolean, intervaloMs = 1000): number {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!activo) return;
    const id = window.setInterval(() => setTick(Date.now()), intervaloMs);
    return () => window.clearInterval(id);
  }, [activo, intervaloMs]);

  return tick;
}

/**
 * Si hay conexión de red, según el navegador.
 *
 * Se lee con `useSyncExternalStore` suscribiéndose a los eventos `online` y
 * `offline`: durante el prerenderizado asume que sí la hay, para no pintar un
 * aviso de "sin conexión" en el HTML estático de alguien que sí la tiene.
 *
 * Ojo con lo que significa: `navigator.onLine` dice que hay *interfaz de red*,
 * no que se llegue a internet. Sirve para avisar, no para decidir nada
 * importante; por eso la app nunca depende de él para funcionar.
 */
export function useEstaEnLinea(): boolean {
  return useSyncExternalStore(
    suscribirAConexion,
    () => navigator.onLine,
    () => true,
  );
}

function suscribirAConexion(alCambiar: () => void): () => void {
  window.addEventListener("online", alCambiar);
  window.addEventListener("offline", alCambiar);
  return () => {
    window.removeEventListener("online", alCambiar);
    window.removeEventListener("offline", alCambiar);
  };
}

/**
 * Estado de interfaz que sobrevive a una recarga.
 *
 * Se lee con `useSyncExternalStore` en vez de con un efecto: durante el
 * prerenderizado devuelve el valor inicial y en el cliente el guardado, sin
 * desajustes de hidratación ni renders en cascada.
 */
export function useEstadoPersistente<T>(clave: string, inicial: T): [T, (valor: T) => void] {
  const suscribir = useCallback(
    (alCambiar: () => void) => almacen.suscribir(clave, alCambiar),
    [clave],
  );

  const valor = useSyncExternalStore(
    suscribir,
    () => almacen.leer(clave, inicial),
    () => inicial,
  );

  const guardar = useCallback((siguiente: T) => almacen.escribir(clave, siguiente), [clave]);

  return [valor, guardar];
}
