import { getExercisesForUser, seedCatalogIfEmpty } from "./repositories/exercises";
import { seedLinksForExercises } from "./repositories/media";
import { crearEntidad } from "./repositories/base";
import type { Equipment, Exercise, MuscleGroup } from "./types";

/**
 * Catalogo global de ejercicios.
 *
 * Son filas con `ownerId: null`: las comparten todos los usuarios. En la
 * Fase 2 este mismo catalogo vivira en el servidor y dejara de sembrarse en
 * cada dispositivo.
 */

type Semilla = [nombre: string, grupo: MuscleGroup, equipo: Equipment];

const CATALOGO: Semilla[] = [
  // Pecho
  ["Press de banca", "pecho", "barra"],
  ["Press inclinado con barra", "pecho", "barra"],
  ["Press de banca con mancuernas", "pecho", "mancuerna"],
  ["Press inclinado con mancuernas", "pecho", "mancuerna"],
  ["Aperturas en polea", "pecho", "polea"],
  ["Fondos en paralelas", "pecho", "peso_corporal"],
  ["Press de pecho en máquina", "pecho", "maquina"],

  // Espalda
  ["Dominadas", "espalda", "peso_corporal"],
  ["Jalón al pecho", "espalda", "polea"],
  ["Remo con barra", "espalda", "barra"],
  ["Remo con mancuerna", "espalda", "mancuerna"],
  ["Remo en polea baja", "espalda", "polea"],
  ["Peso muerto", "espalda", "barra"],
  ["Pullover en polea", "espalda", "polea"],

  // Piernas
  ["Sentadilla", "piernas", "barra"],
  ["Sentadilla frontal", "piernas", "barra"],
  ["Prensa de piernas", "piernas", "maquina"],
  ["Zancadas con mancuernas", "piernas", "mancuerna"],
  ["Peso muerto rumano", "piernas", "barra"],
  ["Curl femoral", "piernas", "maquina"],
  ["Extensión de cuádriceps", "piernas", "maquina"],
  ["Hip thrust", "piernas", "barra"],
  ["Elevación de gemelos", "piernas", "maquina"],
  ["Sentadilla búlgara", "piernas", "mancuerna"],

  // Hombros
  ["Press militar", "hombros", "barra"],
  ["Press de hombros con mancuernas", "hombros", "mancuerna"],
  ["Elevaciones laterales", "hombros", "mancuerna"],
  ["Elevaciones frontales", "hombros", "mancuerna"],
  ["Pájaro", "hombros", "mancuerna"],
  ["Face pull", "hombros", "polea"],

  // Bíceps
  ["Curl con barra", "biceps", "barra"],
  ["Curl con mancuernas", "biceps", "mancuerna"],
  ["Curl martillo", "biceps", "mancuerna"],
  ["Curl predicador", "biceps", "maquina"],
  ["Curl en polea", "biceps", "polea"],

  // Tríceps
  ["Extensión de tríceps en polea", "triceps", "polea"],
  ["Press francés", "triceps", "barra"],
  ["Fondos en banco", "triceps", "peso_corporal"],
  ["Extensión sobre la cabeza", "triceps", "mancuerna"],
  ["Press cerrado", "triceps", "barra"],

  // Core
  ["Plancha", "core", "peso_corporal"],
  ["Elevación de piernas colgado", "core", "peso_corporal"],
  ["Rueda abdominal", "core", "peso_corporal"],
  ["Crunch en polea", "core", "polea"],

  // Cardio
  ["Cinta de correr", "cardio", "maquina"],
  ["Bicicleta estática", "cardio", "maquina"],
  ["Remo ergómetro", "cardio", "maquina"],
  ["Elíptica", "cardio", "maquina"],
];


/**
 * Vídeo de referencia por ejercicio del catálogo.
 *
 * Son enlaces de YouTube, así que NECESITAN CONEXIÓN: están para no empezar
 * de cero, no para sustituir a un vídeo propio, que es el que se ve en el
 * gimnasio sin cobertura.
 *
 * Todos se comprobaron uno a uno contra el oEmbed de YouTube: existen y
 * admiten incrustación. Los ejercicios cuyo vídeo candidato no correspondía
 * de verdad al movimiento se dejaron sin referencia a propósito: una
 * referencia equivocada es peor que ninguna.
 */
export const VIDEOS_CATALOGO: Record<string, string> = {
  "Press de banca": "gRVjAtPip0Y",
  "Press inclinado con barra": "SrqOu55lrYU",
  "Press de banca con mancuernas": "VmB1G1K7v94",
  "Press inclinado con mancuernas": "8iPEnn-ltC8",
  "Aperturas en polea": "Iwe6AmxVf7o",
  "Fondos en paralelas": "2z8JmcrW-As",
  "Press de pecho en máquina": "xUm0BiZCWlQ",
  "Dominadas": "eGo4IYlbE5g",
  "Jalón al pecho": "CAwf7n6Luuc",
  "Remo con barra": "kBWAon7ItDw",
  "Remo con mancuerna": "pYcpY20QaE8",
  "Remo en polea baja": "GZbfZ033f74",
  "Peso muerto": "op9kVnSso6Q",
  "Sentadilla": "SW_C1A-rejs",
  "Sentadilla frontal": "uYumuL_G_V0",
  "Prensa de piernas": "IZxyjW7MPJQ",
  "Zancadas con mancuernas": "D7KaRcUTQeE",
  "Peso muerto rumano": "JCXUYuzwNrM",
  "Curl femoral": "1Tq3QdYUuHs",
  "Extensión de cuádriceps": "YyvSfVjQeL0",
  "Hip thrust": "xDmFkJxPzeM",
  "Elevación de gemelos": "-M4-G8p8fmc",
  "Sentadilla búlgara": "2C-uNgKwPLE",
  "Press militar": "2yjwXTZQDDI",
  "Press de hombros con mancuernas": "qEwKCR5JCog",
  "Elevaciones laterales": "3VcKaXpzqRo",
  "Elevaciones frontales": "hRJ6tR5-if0",
  "Pájaro": "ttvfGg9d76c",
  "Face pull": "rep-qVOkqgk",
  "Curl con barra": "kwG2ipFRgfo",
  "Curl con mancuernas": "sAq_ocpRh_I",
  "Curl martillo": "zC3nLlEvin4",
  "Curl predicador": "fIWP-FRFNU0",
  "Curl en polea": "AsAVbj7puKo",
  "Extensión de tríceps en polea": "2-LAMcpzODU",
  "Press francés": "d_KZxkY_0cM",
  "Fondos en banco": "6kALZikXxLc",
  "Extensión sobre la cabeza": "_gsUck-7M74",
  "Plancha": "pSHjTRCQxIw",
  "Elevación de piernas colgado": "hdng3Nm1x_E",
  "Rueda abdominal": "rqiTPdK1c_I",
  "Remo ergómetro": "H0r_ZPXJLtg",
};

/**
 * Siembra el catalogo la primera vez que se abre la app.
 *
 * Es idempotente y a prueba de llamadas simultaneas: la promesa se guarda para
 * que dos montajes seguidos compartan el mismo trabajo, y el repositorio
 * comprueba e inserta dentro de una sola transaccion.
 */
let siembra: Promise<void> | null = null;

export function sembrarCatalogo(userId: string): Promise<void> {
  siembra ??= sembrar(userId);
  return siembra;
}

/** Vuelve a crear las referencias que falten. Lo dispara el usuario. */
export async function sembrarReferencias(userId: string): Promise<number> {
  const catalogo = await getExercisesForUser(userId);
  return seedLinksForExercises(userId, VIDEOS_CATALOGO, catalogo);
}

async function sembrar(userId: string): Promise<void> {
  const ejercicios = CATALOGO.map(([name, muscleGroup, equipment]) =>
    crearEntidad<Exercise>({
      name,
      muscleGroup,
      equipment,
      isCustom: false,
      ownerId: null,
    }),
  );

  const sembrado = await seedCatalogIfEmpty(ejercicios);

  // Las referencias solo se crean junto al catálogo, no en cada arranque: si
  // borras una, no debe reaparecer sola al abrir la app.
  if (sembrado) await seedLinksForExercises(userId, VIDEOS_CATALOGO, ejercicios);
}
