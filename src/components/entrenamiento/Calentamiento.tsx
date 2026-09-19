"use client";

import { numeroCorto, desdeKg } from "@/lib/format";
import type { PasoCalentamiento } from "@/lib/progression";
import type { SetLog, Unit } from "@/lib/types";
import { IconoCheck, IconoLlama } from "../iconos";
import { juntar, Rotulo } from "../ui";

/**
 * Rampa de calentamiento del ejercicio activo.
 *
 * Cada escalón se registra con un toque, igual que una serie efectiva, pero
 * marcado como calentamiento: cuenta para el historial y no ensucia el
 * volumen ni los récords.
 *
 * Va plegado cuando ya se ha hecho: una vez calientas, deja de interesarte.
 */
export function Calentamiento({
  pasos,
  hechas,
  unidad,
  alRegistrar,
  alDeshacer,
}: {
  pasos: PasoCalentamiento[];
  hechas: SetLog[];
  unidad: Unit;
  alRegistrar: (paso: PasoCalentamiento) => void;
  alDeshacer: (serie: SetLog) => void;
}) {
  if (pasos.length === 0 && hechas.length === 0) return null;

  return (
    <section className="mx-4 mb-3 rounded-lg border border-borde bg-superficie p-3 lg:mx-0">
      <div className="mb-2 flex items-center gap-2">
        <IconoLlama width={16} height={16} className="shrink-0 text-aviso" />
        <Rotulo className="flex-1">Calentamiento</Rotulo>
        {hechas.length > 0 && (
          <span className="etiqueta-caps text-aviso">
            {hechas.length} {hechas.length === 1 ? "hecho" : "hechos"}
          </span>
        )}
      </div>

      {hechas.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {hechas.map((serie) => (
            <li key={serie.id}>
              <button
                type="button"
                onClick={() => alDeshacer(serie)}
                aria-label={`Deshacer calentamiento de ${numeroCorto(desdeKg(serie.weightKg, unidad))} ${unidad}`}
                className="etiqueta-md flex items-center gap-1.5 rounded border border-aviso/40 bg-aviso/10 px-2.5 py-1.5 text-aviso tabular-nums"
              >
                <IconoCheck width={14} height={14} />
                {numeroCorto(desdeKg(serie.weightKg, unidad))} × {serie.reps}
              </button>
            </li>
          ))}
        </ul>
      )}

      {pasos.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {pasos.map((paso, indice) => (
              <li key={`${paso.etiqueta}-${indice}`}>
                <button
                  type="button"
                  onClick={() => alRegistrar(paso)}
                  className={juntar(
                    "tactil flex w-full flex-col items-center justify-center rounded border border-borde",
                    "bg-superficie-2 px-2 py-1.5 transition active:bg-superficie-3",
                  )}
                >
                  <span className="etiqueta-caps text-suave">{paso.etiqueta}</span>
                  <span className="titulo-sm tabular-nums">
                    {numeroCorto(desdeKg(paso.pesoKg, unidad))} × {paso.reps}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-suave">
            Toca cada escalón al terminarlo. No cuentan para el volumen ni para los récords.
          </p>
        </>
      )}
    </section>
  );
}
