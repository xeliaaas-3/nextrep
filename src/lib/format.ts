import type { Equipment, Medicion, MuscleGroup, SetLog, Unit } from "./types";

/**
 * Presentacion. El peso SIEMPRE se guarda en kilogramos; las libras son una
 * conversion de pantalla y nunca llegan a la base de datos.
 */

const LB_POR_KG = 2.2046226218;

export function kgALb(kg: number): number {
  return kg * LB_POR_KG;
}

export function lbAKg(lb: number): number {
  return lb / LB_POR_KG;
}

/** Convierte de kg a la unidad de presentacion del usuario. */
export function desdeKg(kg: number, unidad: Unit): number {
  const valor = unidad === "kg" ? kg : kgALb(kg);
  return Math.round(valor * 100) / 100;
}

/** Convierte lo que escribe el usuario a los kg que guardamos. */
export function aKg(valor: number, unidad: Unit): number {
  const kg = unidad === "kg" ? valor : lbAKg(valor);
  return Math.round(kg * 100) / 100;
}

/** "1 ejercicio", "3 ejercicios". */
export function plural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** Duracion de descanso legible: 90s, 2 min, 2:30. */
export function formatearDescanso(segundos: number): string {
  if (segundos < 120) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return resto === 0 ? `${minutos} min` : `${minutos}:${String(resto).padStart(2, "0")}`;
}

/**
 * Numero sin decimales innecesarios y con coma decimal: 80, 82,5, 7,25.
 *
 * La coma no es un capricho: en un disco de gimnasio español pone "2,5 kg", y
 * leer "82.5" obliga a traducir mentalmente. Los campos aceptan las dos formas.
 */
export function numeroCorto(valor: number): string {
  const redondeado = Math.round(valor * 100) / 100;
  return Number.isInteger(redondeado)
    ? String(redondeado)
    : String(redondeado).replace(".", ",");
}

export function formatearPeso(kg: number, unidad: Unit): string {
  return `${numeroCorto(desdeKg(kg, unidad))} ${unidad}`;
}

/** Volumen abreviado: 12.4k kg. */
export function formatearVolumen(kg: number, unidad: Unit): string {
  const valor = desdeKg(kg, unidad);
  if (valor >= 1000) return `${numeroCorto(Math.round(valor / 100) / 10)}k ${unidad}`;
  return `${numeroCorto(Math.round(valor))} ${unidad}`;
}

/**
 * Resumen de una tanda de series: `80 kg x 8, 8, 7`. Si hubo pesos distintos
 * se detalla cada serie: `80x8, 75x8, 70x6`.
 */
export function resumenSeries(
  series: SetLog[],
  unidad: Unit,
  medicion: Medicion = "reps",
): string {
  const efectivas = series.filter((s) => !s.isWarmup);
  if (efectivas.length === 0) return "sin series";

  // Por tiempo y sin carga, lo que interesa es la duración de cada intento.
  if (medicion === "tiempo" && efectivas.every((s) => s.weightKg <= 0)) {
    return efectivas.map((s) => formatearSegundos(s.reps)).join(", ");
  }

  const pesos = new Set(efectivas.map((s) => s.weightKg));
  if (pesos.size === 1) {
    const peso = formatearPeso(efectivas[0].weightKg, unidad);
    return `${peso} × ${efectivas.map((s) => s.reps).join(", ")}`;
  }

  return efectivas
    .map((s) => `${numeroCorto(desdeKg(s.weightKg, unidad))}×${s.reps}`)
    .join(", ");
}

/** Segundos legibles: "45 s", "1:30". */
export function formatearSegundos(segundos: number): string {
  if (segundos < 60) return `${segundos} s`;
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return resto === 0 ? `${minutos} min` : `${minutos}:${String(resto).padStart(2, "0")}`;
}

/**
 * Una serie en una línea, según cómo se mida el ejercicio y si lleva carga.
 *
 * "0 kg × 30" para un estiramiento de medio minuto no se entiende; esto
 * produce "30 s", y si además hay peso, "20 kg · 30 s".
 */
export function formatearSerie(
  pesoKg: number,
  valor: number,
  unidad: Unit,
  medicion: Medicion = "reps",
): string {
  const cantidad = medicion === "tiempo" ? formatearSegundos(valor) : `${valor} reps`;
  if (pesoKg <= 0) return cantidad;

  const peso = formatearPeso(pesoKg, unidad);
  return medicion === "tiempo" ? `${peso} · ${cantidad}` : `${peso} × ${valor}`;
}

const ETIQUETAS_GRUPO: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  piernas: "Piernas",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  core: "Core",
  cardio: "Cardio",
  movilidad: "Calentamiento",
  estiramiento: "Estiramientos",
};

export function etiquetaGrupo(grupo: MuscleGroup): string {
  return ETIQUETAS_GRUPO[grupo];
}

const ETIQUETAS_EQUIPO: Record<Equipment, string> = {
  barra: "Barra",
  mancuerna: "Mancuerna",
  maquina: "Máquina",
  polea: "Polea",
  banda: "Banda elástica",
  peso_corporal: "Peso corporal",
};

export function etiquetaEquipo(equipo: Equipment): string {
  return ETIQUETAS_EQUIPO[equipo];
}

/** Color de acento por grupo muscular, para graficas y etiquetas. */
export const COLOR_GRUPO: Record<MuscleGroup, string> = {
  pecho: "#f472b6",
  espalda: "#60a5fa",
  piernas: "#fbbf24",
  hombros: "#34d399",
  biceps: "#c08cf7",
  triceps: "#22d3ee",
  core: "#fb923c",
  cardio: "#f87171",
  movilidad: "#ffb547",
  estiramiento: "#43d17a",
};
