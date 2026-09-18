"use client";

import { useEffect, useRef } from "react";
import { notificarDescansoTerminado, sonarAlarma, vibrar } from "@/lib/alerta";
import { useTicker } from "@/lib/hooks";
import { formatearCronometro } from "@/lib/time";
import { IconoCerrar, IconoCronometro } from "../iconos";
import { juntar } from "../ui";

/**
 * Descanso entre series. Va justo encima del botón de completar, dentro del
 * alcance del pulgar.
 *
 * La cuenta atrás se deriva de `finEn`, una marca de tiempo absoluta guardada
 * al confirmar la serie. Nunca acumulamos segundos en un intervalo: así, si el
 * navegador congela la pestaña con la pantalla apagada, al volver el tiempo
 * mostrado sigue siendo el real.
 */
export function TemporizadorDescanso({
  iniciadoEn,
  finEn,
  alCancelar,
  alSumar,
}: {
  iniciadoEn: number;
  finEn: number;
  alCancelar: () => void;
  alSumar: (segundos: number) => void;
}) {
  const ahoraMs = useTicker(true, 250);
  const yaAvisado = useRef<number | null>(null);

  const restante = (finEn - ahoraMs) / 1000;
  const terminado = restante <= 0;

  useEffect(() => {
    if (!terminado) return;
    // Un solo aviso por descanso, aunque el componente se vuelva a pintar.
    if (yaAvisado.current === finEn) return;

    yaAvisado.current = finEn;
    sonarAlarma();
    vibrar();
    void notificarDescansoTerminado();
  }, [finEn, terminado]);

  const duracion = Math.max(1, finEn - iniciadoEn);
  const progreso = terminado ? 1 : Math.min(1, Math.max(0, (ahoraMs - iniciadoEn) / duracion));

  return (
    <div
      className={juntar(
        "rounded-lg border bg-superficie-2 px-3 py-2",
        terminado ? "serie-activa" : "border-borde",
      )}
      role="timer"
      aria-live="off"
    >
      <div className="flex items-center gap-3">
        <IconoCronometro
          width={18}
          height={18}
          className={terminado ? "shrink-0 text-acento-texto" : "shrink-0 text-suave"}
        />

        <div className="min-w-0 flex-1">
          <p className="etiqueta-caps text-suave">
            {terminado ? "Descanso terminado" : "Descansando"}
          </p>
          <p
            className={juntar(
              "metrica leading-none",
              terminado ? "animar-latido text-acento-texto" : "text-texto",
            )}
          >
            {formatearCronometro(Math.abs(restante))}
          </p>
        </div>

        {[30, 60].map((extra) => (
          <button
            key={extra}
            type="button"
            onClick={() => alSumar(extra)}
            className="etiqueta-caps tactil rounded border border-borde bg-superficie px-2.5 text-suave active:bg-superficie-3"
          >
            +{extra}s
          </button>
        ))}

        <button
          type="button"
          onClick={alCancelar}
          aria-label="Saltar descanso"
          className="tactil grid shrink-0 place-items-center rounded border border-borde bg-superficie px-2.5 text-suave active:bg-superficie-3"
        >
          <IconoCerrar width={18} height={18} />
        </button>
      </div>

      <span
        aria-hidden
        className="mt-2 block h-1 overflow-hidden rounded-full bg-superficie-3"
      >
        <span
          className="block h-full rounded-full bg-acento transition-[width] duration-300"
          style={{ width: `${progreso * 100}%` }}
        />
      </span>
    </div>
  );
}
