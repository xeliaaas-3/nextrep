import { getExercisesForUser, syncCatalog } from "./repositories/exercises";
import { seedLinksForExercises } from "./repositories/media";
import { crearEntidad } from "./repositories/base";
import type { Equipment, Exercise, Medicion, MuscleGroup } from "./types";

/**
 * Catalogo global de ejercicios.
 *
 * Son filas con `ownerId: null`: las comparten todos los usuarios. En la
 * Fase 2 este mismo catalogo vivira en el servidor y dejara de sembrarse en
 * cada dispositivo.
 */

type Semilla = [nombre: string, grupo: MuscleGroup, equipo: Equipment, medicion?: Medicion];

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
  ["Plancha", "core", "peso_corporal", "tiempo"],
  ["Elevación de piernas colgado", "core", "peso_corporal"],
  ["Rueda abdominal", "core", "peso_corporal"],
  ["Crunch en polea", "core", "polea"],

  // Cardio
  ["Cinta de correr", "cardio", "maquina"],
  ["Bicicleta estática", "cardio", "maquina"],
  ["Remo ergómetro", "cardio", "maquina"],
  ["Elíptica", "cardio", "maquina"],

  // Calentamiento y movilidad, para antes de entrenar
  ["Saltos de tijera", "movilidad", "peso_corporal", "tiempo"],
  ["Comba", "movilidad", "peso_corporal", "tiempo"],
  ["Círculos de brazos", "movilidad", "peso_corporal"],
  ["Band pull-apart", "movilidad", "banda"],
  ["Dislocaciones de hombro con banda", "movilidad", "banda"],
  ["Gato-camello", "movilidad", "peso_corporal"],
  ["Rotación torácica en cuadrupedia", "movilidad", "peso_corporal"],
  ["Balanceo de piernas", "movilidad", "peso_corporal"],
  ["Puente de glúteos", "movilidad", "peso_corporal"],
  ["Sentadilla profunda sostenida", "movilidad", "peso_corporal", "tiempo"],
  ["Zancada con rotación", "movilidad", "peso_corporal"],
  ["Caminata del oso", "movilidad", "peso_corporal", "tiempo"],

  // Estiramientos, para después
  ["Estiramiento de isquiotibiales", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de cuádriceps de pie", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de flexores de cadera", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de glúteo (figura 4)", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de gemelo en pared", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de pectoral en marco", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de dorsal colgado", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de tríceps sobre la cabeza", "estiramiento", "peso_corporal", "tiempo"],
  ["Estiramiento de cuello lateral", "estiramiento", "peso_corporal", "tiempo"],
  ["Torsión espinal tumbado", "estiramiento", "peso_corporal", "tiempo"],
  ["Postura del niño", "estiramiento", "peso_corporal", "tiempo"],
];


/**
 * Vídeo de referencia por ejercicio del catálogo.
 *
 * Son enlaces de YouTube, así que NECESITAN CONEXIÓN: están para no empezar
 * de cero, no para sustituir a un vídeo propio, que es el que se ve en el
 * gimnasio sin cobertura.
 *
 * Todos se buscaron en YouTube y se comprobaron uno a uno contra su oEmbed:
 * existen y permiten incrustarse (un vídeo con la incrustación desactivada
 * devuelve 401 ahí, no 200). Además se revisó que el título correspondiera de
 * verdad al movimiento: una referencia equivocada es peor que ninguna.
 *
 * Las máquinas de cardio —cinta, bicicleta y elíptica— se quedan sin vídeo a
 * propósito: no tienen técnica que consultar entre series.
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
  "Pullover en polea": "b85nuVcpnlo",
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
  "Press cerrado": "dlA8DTO-Zro",
  "Plancha": "pSHjTRCQxIw",
  "Elevación de piernas colgado": "hdng3Nm1x_E",
  "Rueda abdominal": "rqiTPdK1c_I",
  "Crunch en polea": "ui3iEsYbXtI",
  "Remo ergómetro": "H0r_ZPXJLtg",

  // Calentamiento y movilidad
  "Saltos de tijera": "c4DAnQ6DtF8",
  "Comba": "1BZM2Vre5oc",
  "Círculos de brazos": "140RTNMciH8",
  "Gato-camello": "K9bK0BwKFjs",
  "Puente de glúteos": "wPM8icPu6H8",
  "Band pull-apart": "DKS14AeHJgE",
  "Dislocaciones de hombro con banda": "aXR9dM8TZvc",
  "Rotación torácica en cuadrupedia": "oBA-lEjikKk",
  "Balanceo de piernas": "9z4gtM0ymhQ",
  "Sentadilla profunda sostenida": "jIyBCfCyVZU",
  "Zancada con rotación": "47QGO_jOslI",
  "Caminata del oso": "CqKgj_2uDoo",

  // Estiramientos
  "Estiramiento de isquiotibiales": "FDwpEdxZ4H4",
  "Estiramiento de dorsal colgado": "qlpwY6F4sfo",
  "Estiramiento de cuádriceps de pie": "vgpx6cOBXFM",
  "Estiramiento de flexores de cadera": "2kfJTHITa4w",
  "Estiramiento de glúteo (figura 4)": "nj1-GzbAauI",
  "Estiramiento de gemelo en pared": "TyZAmDcD6mM",
  "Estiramiento de pectoral en marco": "2Z3DNkZ6V0k",
  "Estiramiento de tríceps sobre la cabeza": "SAXzjpf_Juc",
  "Estiramiento de cuello lateral": "dx-zSyVV6OU",
  "Torsión espinal tumbado": "xMv5ltzf__M",
  "Postura del niño": "CLlAUN_r75k",
};

/**
 * Pone el catalogo al dia cada vez que arranca la app.
 *
 * Se ejecuta siempre, no solo la primera vez: asi los ejercicios que se anadan
 * en futuras versiones aparecen sin que haya que reinstalar nada. El
 * repositorio compara por nombre, de modo que llamarlo mil veces no duplica.
 *
 * Es a prueba de llamadas simultaneas: la promesa se guarda para que dos
 * montajes seguidos compartan el mismo trabajo.
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
  const ejercicios = CATALOGO.map(([name, muscleGroup, equipment, tracking]) =>
    crearEntidad<Exercise>({
      name,
      muscleGroup,
      equipment,
      tracking: tracking ?? "reps",
      isCustom: false,
      ownerId: null,
    }),
  );

  const { anadidos } = await syncCatalog(ejercicios);

  // Solo se crean referencias para los ejercicios recien anadidos. Si se
  // hiciera para todos, una referencia que hayas borrado reaparecería en el
  // siguiente arranque.
  if (anadidos.length > 0) {
    await seedLinksForExercises(userId, VIDEOS_CATALOGO, anadidos);
  }
}
