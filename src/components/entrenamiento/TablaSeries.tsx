"use client";

import { desdeKg, numeroCorto } from "@/lib/format";
import type { SetLog, Unit, UUID } from "@/lib/types";
import { IconoCheck, IconoLapiz, IconoMas } from "../iconos";
import { juntar } from "../ui";
import { EditorDeSerie, type ValoresSerie } from "./EditorDeSerie";

/**
 * Tabla de series del ejercicio activo.
 *
 * Columnas fijas SERIE · TIPO · CARGA · REPS · ESTADO para poder leerla de un
 * vistazo con el móvil en el suelo. Las series ya hechas se quedan compactas;
 * solo la que toca ahora se despliega con los controles.
 */
export function TablaSeries({
  seriesHechas,
  filasTotales,
  unidad,
  numeroActivo,
  editando,
  valoresIniciales,
  barraSuperior,
  alConfirmar,
  alGuardarEdicion,
  alAbrirEdicion,
  alCerrarEdicion,
  alAnadirFila,
}: {
  seriesHechas: SetLog[];
  filasTotales: number;
  unidad: Unit;
  numeroActivo: number;
  /** Id de una serie ya registrada que se está corrigiendo; `null` = la activa. */
  editando: UUID | null;
  valoresIniciales: ValoresSerie;
  barraSuperior?: React.ReactNode;
  alConfirmar: (valores: ValoresSerie) => void;
  alGuardarEdicion: (id: UUID, valores: ValoresSerie) => void;
  alAbrirEdicion: (id: UUID) => void;
  alCerrarEdicion: () => void;
  alAnadirFila: () => void;
}) {
  return (
    <section className="px-4">
      <div className="mb-2 grid grid-cols-[2.5rem_4rem_1fr_3.5rem_3rem] items-center gap-2 px-2">
        <span className="etiqueta-caps text-suave">Serie</span>
        <span className="etiqueta-caps text-suave">Tipo</span>
        <span className="etiqueta-caps text-right text-suave">Carga</span>
        <span className="etiqueta-caps text-right text-suave">Reps</span>
        <span className="etiqueta-caps text-right text-suave">Estado</span>
      </div>

      <ul className="space-y-2">
        {Array.from({ length: filasTotales }, (_, indice) => {
          const serie = seriesHechas[indice] ?? null;
          const numero = indice + 1;

          // La fila desplegada es la que se está corrigiendo o, si no hay
          // ninguna, la primera pendiente.
          const esEdicion = serie !== null && editando === serie.id;
          const esActiva = serie === null && editando === null && numero === numeroActivo;

          if (esEdicion || esActiva) {
            return (
              <li key={serie?.id ?? `activa-${numero}`}>
                <EditorDeSerie
                  // Montar de nuevo al cambiar de serie es lo que refresca los
                  // valores de partida sin sincronizar estado en un efecto.
                  key={[serie?.id ?? "activa", numero, unidad, valoresIniciales.pesoKg, valoresIniciales.reps].join(
                    "-",
                  )}
                  numero={numero}
                  unidad={unidad}
                  inicial={valoresIniciales}
                  modo={esEdicion ? "guardar" : "completar"}
                  barraSuperior={barraSuperior}
                  alConfirmar={(valores) =>
                    esEdicion && serie ? alGuardarEdicion(serie.id, valores) : alConfirmar(valores)
                  }
                  alCancelar={esEdicion ? alCerrarEdicion : undefined}
                />
              </li>
            );
          }

          if (serie) {
            return (
              <li key={serie.id}>
                <FilaHecha
                  serie={serie}
                  numero={numero}
                  unidad={unidad}
                  alEditar={() => alAbrirEdicion(serie.id)}
                />
              </li>
            );
          }

          return (
            <li key={`pendiente-${numero}`}>
              <FilaPendiente numero={numero} />
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={alAnadirFila}
        className="tactil mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-borde-fuerte text-suave active:bg-superficie-2"
      >
        <IconoMas width={18} height={18} />
        Añadir serie
      </button>
    </section>
  );
}

function FilaHecha({
  serie,
  numero,
  unidad,
  alEditar,
}: {
  serie: SetLog;
  numero: number;
  unidad: Unit;
  alEditar: () => void;
}) {
  return (
    <div
      className={juntar(
        "grid grid-cols-[2.5rem_4rem_1fr_3.5rem_3rem] items-center gap-2 rounded-lg border border-borde bg-superficie px-2 py-2",
        serie.isWarmup && "opacity-70",
      )}
    >
      <span className="etiqueta-md flex items-baseline gap-1 tabular-nums">
        {serie.isWarmup ? "C" : "S"}
        {numero}
        {serie.rpe != null && (
          <span className="text-[10px] font-semibold text-info">R{numeroCorto(serie.rpe)}</span>
        )}
      </span>

      <span className="etiqueta-caps rounded bg-superficie-2 px-1.5 py-1 text-center text-suave">
        {serie.isWarmup ? "Calent." : "Efect."}
      </span>

      <span className="titulo-sm text-right tabular-nums">
        {numeroCorto(desdeKg(serie.weightKg, unidad))}
        <span className="etiqueta-caps ml-1 text-suave">{unidad}</span>
      </span>

      <span className="titulo-sm text-right tabular-nums">{serie.reps}</span>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={alEditar}
          aria-label={`Corregir serie ${numero}`}
          className="tactil grid place-items-center rounded border border-borde bg-superficie-2 text-suave active:bg-superficie-3"
        >
          <IconoLapiz width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

function FilaPendiente({ numero }: { numero: number }) {
  return (
    <div className="grid grid-cols-[2.5rem_4rem_1fr_3.5rem_3rem] items-center gap-2 rounded-lg border border-borde bg-superficie/40 px-2 py-2 text-suave/50">
      <span className="etiqueta-md tabular-nums">S{numero}</span>
      <span className="etiqueta-caps rounded bg-superficie-2/60 px-1.5 py-1 text-center">
        Efect.
      </span>
      <span className="titulo-sm text-right">—</span>
      <span className="titulo-sm text-right">—</span>
      <div className="flex justify-end">
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded border border-borde bg-superficie-2/60"
        >
          <IconoCheck width={14} height={14} />
        </span>
      </div>
    </div>
  );
}
