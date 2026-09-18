import { numeroCorto } from "./format";
import type { RendimientoPrevio } from "./repositories";
import type { MuscleGroup } from "./types";

/**
 * Progresion sugerida.
 *
 * La sugerencia SIEMPRE es editable: la app propone, nunca bloquea. Si el
 * usuario escribe otro peso, ese es el que manda.
 */

export type MotivoProgresion = "primera-vez" | "subir" | "mantener" | "bajar";

export interface Sugerencia {
  weightKg: number;
  reps: number;
  motivo: MotivoProgresion;
  explicacion: string;
}

/** El tren inferior progresa a saltos mayores que el superior. */
const GRUPOS_TREN_INFERIOR: MuscleGroup[] = ["piernas"];

export function incrementoPara(grupo: MuscleGroup): number {
  return GRUPOS_TREN_INFERIOR.includes(grupo) ? 5 : 2.5;
}

/** Redondea a un peso que exista de verdad en un gimnasio (medio kilo). */
export function redondearPeso(kg: number): number {
  return Math.max(0, Math.round(kg * 2) / 2);
}

interface ParametrosProgresion {
  grupo: MuscleGroup;
  repRangeMin: number;
  repRangeMax: number;
  /** De la mas reciente a la mas antigua. */
  historial: RendimientoPrevio[];
}

/**
 * Reglas, en orden:
 *
 * 1. Sin historial, no se inventa nada: la sugerencia queda vacia.
 * 2. Si la ultima vez se completaron todas las series en el tope del rango,
 *    sube el peso.
 * 3. Si se fallaron repeticiones dos sesiones seguidas, baja un 10% y
 *    reconstruye desde ahi.
 * 4. En cualquier otro caso, mismo peso y una repeticion mas.
 */
export function sugerirObjetivo({
  grupo,
  repRangeMin,
  repRangeMax,
  historial,
}: ParametrosProgresion): Sugerencia {
  const ultima = historial[0];

  if (!ultima || ultima.series.length === 0) {
    return {
      weightKg: 0,
      reps: repRangeMin,
      motivo: "primera-vez",
      explicacion: "Primera vez con este ejercicio: elige un peso cómodo.",
    };
  }

  const pesoBase = Math.max(...ultima.series.map((s) => s.weightKg));
  const seriesAlPeso = ultima.series.filter((s) => s.weightKg >= pesoBase);
  const todasEnElTope = seriesAlPeso.every((s) => s.reps >= repRangeMax);

  if (todasEnElTope) {
    const incremento = incrementoPara(grupo);
    return {
      weightKg: redondearPeso(pesoBase + incremento),
      reps: repRangeMin,
      motivo: "subir",
      explicacion: `Completaste todo a ${repRangeMax} repeticiones: +${numeroCorto(incremento)} kg.`,
    };
  }

  if (fallosConsecutivos(historial, repRangeMin) >= 2) {
    return {
      weightKg: redondearPeso(pesoBase * 0.9),
      reps: repRangeMin,
      motivo: "bajar",
      explicacion: "Dos sesiones sin llegar al mínimo: descarga del 10% y reconstruye.",
    };
  }

  const mejorSerie = Math.max(...seriesAlPeso.map((s) => s.reps));
  return {
    weightKg: redondearPeso(pesoBase),
    reps: Math.min(repRangeMax, mejorSerie + 1),
    motivo: "mantener",
    explicacion: "Mismo peso: busca una repetición más que la última vez.",
  };
}

/** Sesiones seguidas, desde la mas reciente, sin llegar al minimo del rango. */
function fallosConsecutivos(historial: RendimientoPrevio[], repRangeMin: number): number {
  let cuenta = 0;
  for (const sesion of historial) {
    if (sesion.series.length === 0) break;
    const fallo = sesion.series.some((s) => s.reps < repRangeMin);
    if (!fallo) break;
    cuenta += 1;
  }
  return cuenta;
}
