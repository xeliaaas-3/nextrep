"use client";

import { useState } from "react";
import { etiquetaEquipo, etiquetaGrupo, COLOR_GRUPO } from "@/lib/format";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { ejercicios as repoEjercicios } from "@/lib/repositories";
import { GRUPOS_MUSCULARES, type Exercise, type MuscleGroup } from "@/lib/types";
import { IconoBuscar, IconoCerrar } from "./iconos";
import { Filtros } from "./ui";

/**
 * Hoja inferior para elegir un ejercicio del catálogo. La usan el editor de
 * rutinas y el modo entrenamiento, para que buscar un ejercicio se sienta
 * igual en los dos sitios.
 *
 * Quien la usa la monta y la desmonta (`{abierto && <SelectorEjercicio …/>}`)
 * en vez de pasarle un booleano: así la búsqueda y el filtro empiezan siempre
 * en blanco, sin ningún efecto que los reinicie.
 */
export function SelectorEjercicio({
  alElegir,
  alCerrar,
  excluir = [],
}: {
  alElegir: (ejercicio: Exercise) => void;
  alCerrar: () => void;
  excluir?: string[];
}) {
  const userId = useUsuarioActual();
  const [texto, setTexto] = useState("");
  const [grupo, setGrupo] = useState<MuscleGroup | "todos">("todos");

  const resultados = useDatos(
    () => repoEjercicios.searchExercises(userId, texto, grupo),
    [userId, texto, grupo],
  );

  const visibles = (resultados ?? []).filter((e) => !excluir.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
      <button
        type="button"
        aria-label="Cerrar"
        className="flex-1"
        onClick={alCerrar}
      />

      <div className="animar-subir flex max-h-[85vh] flex-col rounded-t-2xl border-t border-borde bg-superficie">
        <div className="flex items-center gap-2 border-b border-borde px-4 py-3">
          <h2 className="flex-1 text-lg font-semibold">Elegir ejercicio</h2>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="tactil grid place-items-center rounded-lg text-suave active:bg-superficie-2"
          >
            <IconoCerrar />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="relative">
            <IconoBuscar
              width={18}
              height={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave"
            />
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar ejercicio"
              className="tactil w-full rounded-lg border border-borde bg-superficie-2 pl-10 pr-3 outline-none focus:border-acento"
            />
          </div>

          <Filtros
            valor={grupo}
            alCambiar={setGrupo}
            opciones={[
              { valor: "todos" as const, etiqueta: "Todos" },
              ...GRUPOS_MUSCULARES.map((g) => ({ valor: g, etiqueta: etiquetaGrupo(g) })),
            ]}
          />
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-6">
          {visibles.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-suave">
              No hay ejercicios que coincidan. Puedes crear uno propio desde Ajustes.
            </li>
          )}

          {visibles.map((ejercicio) => (
            <li key={ejercicio.id}>
              <button
                type="button"
                onClick={() => alElegir(ejercicio)}
                className="tactil flex w-full items-center gap-3 rounded-lg px-3 text-left active:bg-superficie-2"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: COLOR_GRUPO[ejercicio.muscleGroup] }}
                />
                <span className="min-w-0 flex-1 py-2">
                  <span className="block truncate">{ejercicio.name}</span>
                  <span className="block text-xs text-suave">
                    {etiquetaGrupo(ejercicio.muscleGroup)} · {etiquetaEquipo(ejercicio.equipment)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
