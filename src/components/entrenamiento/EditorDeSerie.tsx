"use client";

import { useState, type ReactNode } from "react";
import { aKg, desdeKg, numeroCorto } from "@/lib/format";
import type { Unit } from "@/lib/types";
import { IconoCheck } from "../iconos";
import { juntar } from "../ui";

/**
 * La serie que se está registrando ahora mismo.
 *
 * Devuelve dos cosas a la vez: el bloque de steppers que se pinta dentro de la
 * fila activa y el botón fijo de confirmación de abajo. Van juntos a propósito:
 * comparten los mismos valores, y montar el componente entero con una `key`
 * nueva es lo que reinicia los campos al cambiar de serie o de ejercicio, sin
 * ningún efecto que los sincronice.
 *
 * Los números se ajustan con − y +, no con el teclado: abrir el teclado del
 * móvil entre series, con las manos ocupadas, es justo lo que hay que evitar.
 * Aun así el campo se puede tocar y escribir para saltos grandes.
 */

export interface ValoresSerie {
  pesoKg: number;
  reps: number;
  rpe: number | null;
  esCalentamiento: boolean;
}

const RPE_POSIBLES = [6, 7, 8, 9, 10] as const;

export function EditorDeSerie({
  numero,
  unidad,
  inicial,
  modo,
  barraSuperior,
  alConfirmar,
  alCancelar,
}: {
  numero: number;
  unidad: Unit;
  inicial: ValoresSerie;
  modo: "completar" | "guardar";
  /** Fila que va encima del botón: el descanso, en curso o el que se iniciará. */
  barraSuperior?: ReactNode;
  alConfirmar: (valores: ValoresSerie) => void;
  alCancelar?: () => void;
}) {
  // El paso es el salto real de disco más pequeño que se usa en un gimnasio.
  const paso = unidad === "kg" ? 2.5 : 5;

  const [peso, setPeso] = useState(() => numeroCorto(desdeKg(inicial.pesoKg, unidad)));
  const [reps, setReps] = useState(() => String(inicial.reps));
  const [rpe, setRpe] = useState<number | null>(inicial.rpe);
  const [calentamiento, setCalentamiento] = useState(inicial.esCalentamiento);

  const pesoNumero = Number(peso.replace(",", "."));
  const repsNumero = Number(reps);
  const valido =
    Number.isFinite(pesoNumero) &&
    pesoNumero >= 0 &&
    Number.isInteger(repsNumero) &&
    repsNumero > 0;

  const ajustarPeso = (delta: number) => {
    const base = Number.isFinite(pesoNumero) ? pesoNumero : 0;
    setPeso(numeroCorto(Math.max(0, Math.round((base + delta) * 100) / 100)));
  };

  const ajustarReps = (delta: number) => {
    const base = Number.isInteger(repsNumero) ? repsNumero : 0;
    setReps(String(Math.max(1, base + delta)));
  };

  function confirmar() {
    if (!valido) return;
    alConfirmar({
      pesoKg: aKg(pesoNumero, unidad),
      reps: repsNumero,
      rpe,
      esCalentamiento: calentamiento,
    });
  }

  return (
    <>
      <div className="serie-activa animar-aparecer space-y-3 rounded-lg border bg-superficie-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="size-2 animar-pulso rounded-full bg-acento" />
            <span className="etiqueta-caps text-acento-texto">
              {modo === "completar" ? `Serie ${numero} activa` : `Editando serie ${numero}`}
            </span>
            <button
              type="button"
              onClick={() => setCalentamiento(!calentamiento)}
              aria-pressed={calentamiento}
              className={juntar(
                "etiqueta-caps rounded border px-2 py-1 transition",
                calentamiento
                  ? "border-aviso/40 bg-aviso/10 text-aviso"
                  : "border-borde bg-superficie text-suave",
              )}
            >
              {calentamiento ? "Calent." : "Efect."}
            </button>
          </div>

          <SelectorRPE valor={rpe} alCambiar={setRpe} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <BloqueNumero
            etiqueta={`Peso (${unidad})`}
            valor={peso}
            alEscribir={setPeso}
            alBajar={() => ajustarPeso(-paso)}
            alSubir={() => ajustarPeso(paso)}
            modoTeclado="decimal"
          />
          <BloqueNumero
            etiqueta="Repeticiones"
            valor={reps}
            alEscribir={setReps}
            alBajar={() => ajustarReps(-1)}
            alSubir={() => ajustarReps(1)}
            modoTeclado="numeric"
          />
        </div>

        {alCancelar && (
          <button
            type="button"
            onClick={alCancelar}
            className="etiqueta-md w-full py-1 text-suave underline-offset-4 active:underline"
          >
            Cancelar la edición
          </button>
        )}
      </div>

      {/*
        Zona de acción fija. Va pegada abajo, dentro del alcance del pulgar, y
        dice exactamente qué se va a registrar para poder confirmar sin leer dos
        veces.
      */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 backdrop-blur-xl lg:pl-60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-[480px] space-y-2 p-3 lg:max-w-4xl">
          {barraSuperior}

          <button
            type="button"
            disabled={!valido}
            onClick={confirmar}
            className="tactil flex w-full flex-col items-center justify-center gap-0.5 rounded-lg bg-acento py-2.5 text-tinta transition active:scale-[0.98] active:brightness-90 disabled:pointer-events-none disabled:opacity-40"
          >
            <span className="titulo-sm flex items-center gap-2">
              <IconoCheck width={20} height={20} />
              {modo === "completar" ? `Completar serie ${numero}` : "Guardar cambios"}
              <span className="tabular-nums">
                · {numeroCorto(Number.isFinite(pesoNumero) ? pesoNumero : 0)} {unidad} ×{" "}
                {Number.isInteger(repsNumero) ? repsNumero : 0}
              </span>
            </span>
            <span className="text-[11px] font-medium opacity-70">
              {modo === "completar"
                ? "Un toque para registrar e iniciar el descanso"
                : "Se actualizará la serie ya registrada"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

/** Campo numérico grande con − y + a los lados, con 48px de zona de toque. */
function BloqueNumero({
  etiqueta,
  valor,
  alEscribir,
  alBajar,
  alSubir,
  modoTeclado,
}: {
  etiqueta: string;
  valor: string;
  alEscribir: (valor: string) => void;
  alBajar: () => void;
  alSubir: () => void;
  modoTeclado: "decimal" | "numeric";
}) {
  return (
    <div className="rounded-lg border border-borde bg-superficie p-2">
      <label className="block">
        <span className="etiqueta-caps mb-1 block text-center text-suave">{etiqueta}</span>
        <input
          inputMode={modoTeclado}
          value={valor}
          onChange={(e) => alEscribir(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          className="metrica w-full bg-transparent text-center outline-none"
        />
      </label>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={alBajar}
          aria-label={`Bajar ${etiqueta}`}
          className="tactil grid place-items-center rounded border border-borde bg-superficie-2 text-xl active:bg-superficie-3"
        >
          −
        </button>
        <button
          type="button"
          onClick={alSubir}
          aria-label={`Subir ${etiqueta}`}
          className="tactil grid place-items-center rounded border border-borde bg-superficie-2 text-xl active:bg-superficie-3"
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Esfuerzo percibido. Azul y no lima: informa, no es una acción. */
function SelectorRPE({
  valor,
  alCambiar,
}: {
  valor: number | null;
  alCambiar: (valor: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="etiqueta-caps mr-1 text-suave">RPE</span>
      {RPE_POSIBLES.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={valor === n}
          // Volver a tocarlo lo quita: el RPE nunca es obligatorio.
          onClick={() => alCambiar(valor === n ? null : n)}
          className={juntar(
            "etiqueta-md size-8 rounded tabular-nums transition",
            valor === n
              ? "bg-info font-semibold text-white"
              : "bg-superficie text-suave active:bg-superficie-3",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
