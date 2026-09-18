"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAvisos } from "@/components/Avisos";
import { IconoAdelante, IconoCronometro } from "@/components/iconos";
import { Boton, Cabecera, Cargando, Tarjeta, juntar } from "@/components/ui";
import {
  pedirPermisoNotificaciones,
  permisoNotificaciones,
} from "@/lib/alerta";
import { formatearDescanso } from "@/lib/format";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { ajustes as repoAjustes } from "@/lib/repositories";
import type { Theme, Unit } from "@/lib/types";

const DESCANSOS = [60, 90, 120, 150, 180, 240];

/**
 * El navegador no emite ningún evento cuando cambia el permiso de
 * notificaciones, así que avisamos nosotros al concederlo.
 */
const oyentesPermiso = new Set<() => void>();

function suscribirPermiso(alCambiar: () => void): () => void {
  oyentesPermiso.add(alCambiar);
  return () => {
    oyentesPermiso.delete(alCambiar);
  };
}

function permisoCambiado(): void {
  for (const alCambiar of oyentesPermiso) alCambiar();
}

export default function PaginaAjustes() {
  const userId = useUsuarioActual();
  const { avisar } = useAvisos();

  // El permiso lo decide el navegador, no React: se lee con
  // `useSyncExternalStore` para que el prerenderizado y el cliente coincidan.
  const permiso = useSyncExternalStore(
    suscribirPermiso,
    () => permisoNotificaciones(),
    () => "default" as const,
  );

  const guardados = useDatos(() => repoAjustes.getSettings(userId), [userId]);

  if (!guardados) return <Cargando />;

  async function guardar(cambios: Partial<{ unit: Unit; defaultRestSeconds: number; theme: Theme }>) {
    if (!guardados) return;
    await repoAjustes.updateSettings(userId, {
      unit: cambios.unit ?? guardados.unit,
      defaultRestSeconds: cambios.defaultRestSeconds ?? guardados.defaultRestSeconds,
      theme: cambios.theme ?? guardados.theme,
    });
  }

  async function activarNotificaciones() {
    const concedido = await pedirPermisoNotificaciones();
    permisoCambiado();
    avisar({
      mensaje: concedido
        ? "Te avisaremos cuando termine el descanso"
        : "Sin permiso solo sonará y vibrará con la app abierta",
      tono: concedido ? "exito" : "neutro",
    });
  }

  return (
    <>
      <Cabecera titulo="Ajustes" />

      <div className="space-y-4 px-4">
        <Tarjeta>
          <h2 className="mb-3 text-sm font-medium text-suave">Unidad de peso</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["kg", "lb"] as const).map((unidad) => (
              <button
                key={unidad}
                type="button"
                onClick={() => void guardar({ unit: unidad })}
                className={juntar(
                  "tactil rounded-lg border text-sm font-medium transition",
                  guardados.unit === unidad
                    ? "border-acento bg-acento text-tinta"
                    : "border-borde text-suave",
                )}
              >
                {unidad === "kg" ? "Kilogramos" : "Libras"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-suave">
            Los pesos siempre se guardan en kilogramos: cambiar de unidad solo cambia cómo se
            muestran.
          </p>
        </Tarjeta>

        <Tarjeta>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-suave">
            <IconoCronometro width={16} height={16} />
            Descanso por defecto
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {DESCANSOS.map((segundos) => (
              <button
                key={segundos}
                type="button"
                onClick={() => void guardar({ defaultRestSeconds: segundos })}
                className={juntar(
                  "tactil rounded-lg border text-sm tabular-nums transition",
                  guardados.defaultRestSeconds === segundos
                    ? "border-acento bg-acento text-tinta font-medium"
                    : "border-borde text-suave",
                )}
              >
                {formatearDescanso(segundos)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-suave">
            Cada ejercicio de una rutina puede tener el suyo propio.
          </p>
        </Tarjeta>

        <Tarjeta>
          <h2 className="mb-3 text-sm font-medium text-suave">Tema</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["dark", "light"] as const).map((tema) => (
              <button
                key={tema}
                type="button"
                onClick={() => void guardar({ theme: tema })}
                className={juntar(
                  "tactil rounded-lg border text-sm font-medium transition",
                  guardados.theme === tema
                    ? "border-acento bg-acento text-tinta"
                    : "border-borde text-suave",
                )}
              >
                {tema === "dark" ? "Oscuro" : "Claro"}
              </button>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta>
          <h2 className="mb-2 text-sm font-medium text-suave">Avisos de descanso</h2>
          {permiso === "no-soportado" ? (
            <p className="text-sm text-suave">
              Este navegador no admite notificaciones. El temporizador seguirá sonando y vibrando
              con la app abierta.
            </p>
          ) : permiso === "granted" ? (
            <p className="text-sm text-suave">
              Activados. Recibirás un aviso cuando termine el descanso.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-suave">
                Permite las notificaciones para que el aviso te llegue aunque cambies de app.
              </p>
              <Boton ancho onClick={() => void activarNotificaciones()}>
                Activar notificaciones
              </Boton>
            </>
          )}
        </Tarjeta>

        <Link
          href="/ejercicios"
          className="tactil flex items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 active:bg-superficie-2"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Biblioteca de ejercicios</span>
            <span className="block text-sm text-suave">Consulta el catálogo o crea los tuyos</span>
          </span>
          <IconoAdelante className="shrink-0 text-suave" />
        </Link>

        <Tarjeta>
          <h2 className="mb-2 text-sm font-medium text-suave">Tus datos</h2>
          <p className="text-sm text-suave">
            Todo se guarda en este dispositivo y funciona sin conexión. Todavía no hay cuentas ni
            copia en la nube: eso llega en la Fase 2, y lo que tengas ahora se subirá tal cual.
          </p>
        </Tarjeta>
      </div>
    </>
  );
}
