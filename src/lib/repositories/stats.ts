import { claveDia, inicioDeSemana, sumarDias } from "../time";
import type { MuscleGroup, SetLog, UUID, WorkoutSession } from "../types";
import { getExercisesByIds } from "./exercises";
import { getFinishedSessions, getSessionsBetween } from "./sessions";
import { getSetLogsBetween, getSetLogsBySession } from "./setLogs";

/**
 * Consultas de solo lectura que combinan varias tablas: historial, volumen y
 * racha. Viven en la capa de datos para que las pantallas no tengan que
 * orquestar nada.
 */

export interface ResumenSesion {
  session: WorkoutSession;
  totalSeries: number;
  volumenKg: number;
  nombresEjercicios: string[];
}

/** Volumen = suma de peso x repeticiones de las series efectivas. */
export function calcularVolumen(series: SetLog[]): number {
  return series.reduce((total, s) => (s.isWarmup ? total : total + s.weightKg * s.reps), 0);
}

export async function getResumenSesion(session: WorkoutSession): Promise<ResumenSesion> {
  const series = await getSetLogsBySession(session.id);
  const efectivas = series.filter((s) => !s.isWarmup);
  const catalogo = await getExercisesByIds(series.map((s) => s.exerciseId));

  const nombres: string[] = [];
  for (const serie of series) {
    const nombre = catalogo.get(serie.exerciseId)?.name;
    if (nombre && !nombres.includes(nombre)) nombres.push(nombre);
  }

  return {
    session,
    totalSeries: efectivas.length,
    volumenKg: calcularVolumen(efectivas),
    nombresEjercicios: nombres,
  };
}

export async function getResumenesRecientes(
  userId: UUID,
  limite = 20,
): Promise<ResumenSesion[]> {
  const sesiones = await getFinishedSessions(userId, limite);
  return Promise.all(sesiones.map(getResumenSesion));
}

export interface VolumenPorGrupo {
  grupo: MuscleGroup;
  series: number;
  volumenKg: number;
}

/** Volumen de la semana en curso, desglosado por grupo muscular. */
export async function getVolumenSemanal(
  userId: UUID,
  referencia: Date = new Date(),
): Promise<VolumenPorGrupo[]> {
  const lunes = inicioDeSemana(referencia);
  const domingo = sumarDias(lunes, 7);

  const series = await getSetLogsBetween(userId, lunes, domingo);
  if (series.length === 0) return [];

  const catalogo = await getExercisesByIds(series.map((s) => s.exerciseId));
  const acumulado = new Map<MuscleGroup, VolumenPorGrupo>();

  for (const serie of series) {
    const grupo = catalogo.get(serie.exerciseId)?.muscleGroup;
    if (!grupo) continue;

    const actual = acumulado.get(grupo) ?? { grupo, series: 0, volumenKg: 0 };
    actual.series += 1;
    actual.volumenKg += serie.weightKg * serie.reps;
    acumulado.set(grupo, actual);
  }

  return [...acumulado.values()].sort((a, b) => b.volumenKg - a.volumenKg);
}

export interface DiaDeSemana {
  fecha: Date;
  claveDia: string;
  esHoy: boolean;
  esFuturo: boolean;
  sesiones: WorkoutSession[];
}

/** Los siete dias de la semana en curso con sus sesiones terminadas. */
export async function getSemana(
  userId: UUID,
  referencia: Date = new Date(),
): Promise<DiaDeSemana[]> {
  const lunes = inicioDeSemana(referencia);
  const domingo = sumarDias(lunes, 7);
  const sesiones = await getSessionsBetween(userId, lunes, domingo);
  const hoy = claveDia(new Date());

  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = sumarDias(lunes, indice);
    const clave = claveDia(fecha);
    return {
      fecha,
      claveDia: clave,
      esHoy: clave === hoy,
      esFuturo: clave > hoy,
      sesiones: sesiones.filter((s) => claveDia(s.startedAt) === clave),
    };
  });
}

/**
 * Racha: dias consecutivos entrenados hacia atras desde hoy. Si hoy todavia no
 * se ha entrenado, la racha no se rompe hasta que pase el dia, asi que se
 * empieza a contar desde ayer.
 */
export async function getRacha(userId: UUID): Promise<number> {
  const sesiones = await getFinishedSessions(userId, 400);
  if (sesiones.length === 0) return 0;

  const diasEntrenados = new Set(sesiones.map((s) => claveDia(s.startedAt)));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let racha = 0;
  let cursor = diasEntrenados.has(claveDia(hoy)) ? hoy : sumarDias(hoy, -1);

  while (diasEntrenados.has(claveDia(cursor))) {
    racha += 1;
    cursor = sumarDias(cursor, -1);
  }

  return racha;
}
