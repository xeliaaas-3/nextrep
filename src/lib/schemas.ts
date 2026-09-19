import { z } from "zod";
import { EQUIPOS, GRUPOS_MUSCULARES } from "./types";

/**
 * Validacion de los limites de datos: todo lo que entra a un repositorio
 * desde un formulario pasa por aqui antes de tocar la base.
 */

const uuid = z.uuid();
const texto = (max: number) => z.string().trim().max(max);

export const esquemaEjercicio = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  muscleGroup: z.enum(GRUPOS_MUSCULARES),
  equipment: z.enum(EQUIPOS),
  tracking: z.enum(["reps", "tiempo"]),
});

export type EntradaEjercicio = z.infer<typeof esquemaEjercicio>;

export const esquemaRutina = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  description: texto(300),
});

export type EntradaRutina = z.infer<typeof esquemaRutina>;

export const esquemaRutinaEjercicio = z
  .object({
    exerciseId: uuid,
    targetSets: z.number().int().min(1).max(20),
    repRangeMin: z.number().int().min(1).max(100),
    repRangeMax: z.number().int().min(1).max(100),
    restSeconds: z.number().int().min(0).max(900),
    notes: texto(200),
  })
  .refine((v) => v.repRangeMax >= v.repRangeMin, {
    message: "El máximo de repeticiones no puede ser menor que el mínimo",
    path: ["repRangeMax"],
  });

export type EntradaRutinaEjercicio = z.infer<typeof esquemaRutinaEjercicio>;

export const esquemaSerie = z.object({
  sessionId: uuid,
  exerciseId: uuid,
  setNumber: z.number().int().min(1).max(50),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(500),
  rpe: z.number().min(1).max(10).nullable(),
  isWarmup: z.boolean(),
});

export type EntradaSerie = z.infer<typeof esquemaSerie>;

export const esquemaAjustes = z.object({
  unit: z.enum(["kg", "lb"]),
  defaultRestSeconds: z.number().int().min(0).max(900),
  theme: z.enum(["dark", "light"]),
});

export type EntradaAjustes = z.infer<typeof esquemaAjustes>;

/**
 * Traduce un error de Zod a un mapa `campo -> mensaje`, que es lo que
 * consumen los formularios.
 */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const problema of error.issues) {
    const campo = problema.path.join(".") || "_";
    if (!salida[campo]) salida[campo] = problema.message;
  }
  return salida;
}
