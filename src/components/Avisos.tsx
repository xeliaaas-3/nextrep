"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { nuevoId } from "@/lib/ids";

/**
 * Avisos con deshacer.
 *
 * Dentro del entrenamiento no usamos diálogos de confirmación: la acción se
 * ejecuta al momento y aparece un aviso con "Deshacer". Preguntar "¿seguro?"
 * entre series es justo lo que no queremos.
 */

type Tono = "neutro" | "exito" | "peligro";

interface Aviso {
  id: string;
  mensaje: string;
  tono?: Tono;
  accion?: { etiqueta: string; alPulsar: () => void };
}

interface Contexto {
  avisar: (aviso: Omit<Aviso, "id">) => void;
}

const ContextoAvisos = createContext<Contexto | null>(null);

const DURACION_MS = 5000;

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const temporizadores = useRef(new Map<string, number>());

  const cerrar = useCallback((id: string) => {
    setAvisos((actuales) => actuales.filter((a) => a.id !== id));
    const temporizador = temporizadores.current.get(id);
    if (temporizador) {
      window.clearTimeout(temporizador);
      temporizadores.current.delete(id);
    }
  }, []);

  const avisar = useCallback(
    (aviso: Omit<Aviso, "id">) => {
      const id = nuevoId();
      setAvisos((actuales) => [...actuales.slice(-2), { ...aviso, id }]);
      temporizadores.current.set(id, window.setTimeout(() => cerrar(id), DURACION_MS));
    },
    [cerrar],
  );

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => {
      for (const temporizador of pendientes.values()) window.clearTimeout(temporizador);
      pendientes.clear();
    };
  }, []);

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      <div
        // Arriba y no abajo: la zona inferior la ocupan el botón de completar
        // serie y la barra de navegación, que son lo último que hay que tapar.
        className="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col items-center gap-2 px-4 lg:pl-60"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
        role="status"
        aria-live="polite"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className="animar-aparecer pointer-events-auto flex w-full max-w-[480px] items-center gap-3 rounded-lg border border-borde-fuerte bg-superficie-2 px-4 py-3 shadow-[var(--sombra-modal)]"
          >
            <span
              aria-hidden
              className={`size-2 shrink-0 rounded-full ${
                aviso.tono === "exito"
                  ? "bg-exito"
                  : aviso.tono === "peligro"
                    ? "bg-peligro"
                    : "bg-suave"
              }`}
            />
            <p className="flex-1 text-sm">{aviso.mensaje}</p>
            {aviso.accion && (
              <button
                type="button"
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-acento-texto active:bg-borde"
                onClick={() => {
                  aviso.accion?.alPulsar();
                  cerrar(aviso.id);
                }}
              >
                {aviso.accion.etiqueta}
              </button>
            )}
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  );
}

export function useAvisos(): Contexto {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) throw new Error("useAvisos necesita estar dentro de ProveedorAvisos");
  return contexto;
}
