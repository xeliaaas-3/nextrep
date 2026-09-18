"use client";

import { useEffect } from "react";
import { useAjustes, useUsuarioActual } from "@/lib/hooks";
import { ajustes as repoAjustes } from "@/lib/repositories";
import { sembrarCatalogo } from "@/lib/seed";
import { CLAVE_TEMA } from "@/lib/tema";

/**
 * Tareas de arranque: sembrar el catálogo la primera vez, aplicar el tema
 * elegido y registrar el service worker que hace la app instalable y capaz de
 * abrir sin conexión.
 *
 * No pinta nada.
 */
export function ArranqueApp() {
  const userId = useUsuarioActual();
  const { theme } = useAjustes();

  useEffect(() => {
    // Las dos escrituras de arranque viven aquí, fuera de cualquier consulta
    // reactiva: Dexie no permite escribir dentro de un `liveQuery`.
    void sembrarCatalogo(userId);
    void repoAjustes.ensureSettings(userId);
  }, [userId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    // Copia en localStorage para que el script del `<head>` pueda aplicarlo
    // antes del primer pintado. La fuente de verdad sigue siendo IndexedDB.
    try {
      window.localStorage.setItem(CLAVE_TEMA, theme);
    } catch {
      // Sin almacenamiento solo se pierde el arranque sin parpadeo.
    }

    const color = theme === "dark" ? "#0b0a0e" : "#edede9";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [theme]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // En desarrollo el service worker estorba al recargar: solo en producción.
    if (process.env.NODE_ENV !== "production") return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla, la app sigue funcionando: solo se pierde el modo offline.
      });
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
