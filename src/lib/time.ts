import type { ISODate } from "./types";

/** Instante actual en ISO 8601 UTC. Fuente unica de tiempo de la app. */
export function ahora(): ISODate {
  return new Date().toISOString();
}

/** Clave `YYYY-MM-DD` en hora local, para agrupar por dia de calendario. */
export function claveDia(fecha: Date | ISODate): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Lunes de la semana a la que pertenece la fecha, a las 00:00 locales. */
export function inicioDeSemana(fecha: Date = new Date()): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  // getDay(): 0 = domingo. Queremos que la semana empiece en lunes.
  const desplazamiento = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - desplazamiento);
  return d;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

export const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"] as const;

/** Diferencia en dias de calendario entre dos instantes. */
export function diasDeDiferencia(desde: ISODate, hasta: ISODate = ahora()): number {
  const a = new Date(desde);
  const b = new Date(hasta);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** "hoy", "ayer", "hace 4 dias"... */
export function tiempoRelativo(fecha: ISODate): string {
  const dias = diasDeDiferencia(fecha);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 14) return "hace 1 semana";
  if (dias < 30) return `hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 60) return "hace 1 mes";
  return `hace ${Math.floor(dias / 30)} meses`;
}

/** Segundos a `M:SS`. */
export function formatearCronometro(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const min = Math.floor(s / 60);
  const resto = s % 60;
  return `${min}:${String(resto).padStart(2, "0")}`;
}

/**
 * Reloj de la sesión en curso: "18:42", "1:04:07".
 *
 * En minutos redondeados no se aprecia que corre; con los segundos a la vista
 * el entrenamiento se siente en marcha.
 */
export function formatearReloj(desde: ISODate, hasta: ISODate): string {
  const ms = Math.max(0, new Date(hasta).getTime() - new Date(desde).getTime());
  const total = Math.floor(ms / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundos).padStart(2, "0");
  return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Duracion legible de una sesion: "48 min", "1 h 12 min". */
export function formatearDuracion(desde: ISODate, hasta: ISODate): string {
  const ms = new Date(hasta).getTime() - new Date(desde).getTime();
  const minutos = Math.max(0, Math.round(ms / 60_000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatearFecha(fecha: ISODate): string {
  return FORMATO_FECHA.format(new Date(fecha));
}

export function formatearHora(fecha: ISODate): string {
  return new Date(fecha).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
