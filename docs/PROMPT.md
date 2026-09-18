# Prompt: App web de rutinas de gimnasio (escalable a multiusuario)

## Contexto

Quiero construir una aplicación web para registrar y organizar mis rutinas de
gimnasio. En la primera etapa la uso solo yo, pero está diseñada desde el inicio
para que después la use más gente del gimnasio sin reescribir nada.

El problema central no es planificar la rutina: es **registrarla mientras
entreno**, con las manos ocupadas, entre series, y muchas veces sin señal de
internet. Toda decisión de diseño se subordina a eso.

## Principios de arquitectura (no negociables)

1. **Offline-first real.** IndexedDB es la fuente de verdad. La app funciona al
   100% sin conexión. La nube es respaldo y sincronización, nunca un requisito
   para entrenar.
2. **Multiusuario desde el modelo de datos, aunque todavía no haya login.**
   Cada tabla de datos personales lleva `userId`. En la Fase 1 su valor es
   siempre la constante `LOCAL_USER_ID`. Nunca se consulta una tabla personal
   sin filtrar por `userId`.
3. **IDs UUID v4 generados en el cliente.** Prohibidos los enteros
   autoincrementales: dos dispositivos creando registros sin conexión
   colisionarían al sincronizar.
4. **Toda fila lleva `createdAt`, `updatedAt` y `deletedAt`.** El borrado es
   siempre suave (`deletedAt`), nunca físico. Sin esto la sincronización es
   imposible: no se puede resolver qué versión gana ni propagar un borrado.
5. **Catálogo separado de datos personales.** Los ejercicios son un catálogo
   compartido; rutinas, sesiones y series pertenecen a un usuario.
6. **Capa de repositorio abstracta.** Los componentes de React nunca llaman a
   Dexie directamente: pasan por `src/lib/repositories/*`. Así, añadir
   sincronización en la Fase 2 no toca ni un componente de UI.

## Stack

- Next.js (App Router) + TypeScript en modo `strict`
- Tailwind CSS
- Dexie.js sobre IndexedDB
- PWA instalable (manifest + service worker), modo oscuro por defecto
- Zod para validar los límites de datos
- **Fase 2 y solo entonces:** Supabase (Postgres, Auth, Row Level Security)

No instales Supabase, NextAuth ni ningún backend en la Fase 1.

## Modelo de datos

Campos comunes en todas las tablas: `id` (UUID), `createdAt`, `updatedAt`
(timestamps ISO 8601 UTC), `deletedAt` (nullable).

**exercises** — catálogo de ejercicios
- `name`, `muscleGroup` (pecho | espalda | piernas | hombros | biceps | triceps
  | core | cardio), `equipment` (barra | mancuerna | maquina | polea |
  peso_corporal), `isCustom` (boolean)
- `ownerId`: `null` si es del catálogo global, o el `userId` si lo creó el usuario

**routines** — plantillas de entrenamiento
- `userId`, `name`, `description`, `sortOrder`, `isArchived`

**routineExercises** — ejercicios dentro de una rutina
- `routineId`, `exerciseId`, `sortOrder`, `targetSets`, `repRangeMin`,
  `repRangeMax`, `restSeconds`, `notes`

**workoutSessions** — una sesión real de entrenamiento
- `userId`, `routineId` (nullable: permite sesiones libres), `startedAt`,
  `finishedAt` (nullable mientras está en curso), `notes`

**setLogs** — una serie ejecutada
- `sessionId`, `exerciseId`, `setNumber`, `weightKg` (siempre guardado en kg;
  la conversión a libras es solo de presentación), `reps`, `rpe` (1-10,
  nullable), `isWarmup`, `completedAt`

**personalRecords** — caché derivado de setLogs, para no recalcular
- `userId`, `exerciseId`, `weightKg`, `reps`, `estimated1rm`, `achievedAt`

**userSettings**
- `userId`, `unit` (kg | lb), `defaultRestSeconds`, `theme`, `lastSyncedAt`

Índices obligatorios en Dexie: `[userId+updatedAt]` en cada tabla personal,
`[sessionId+exerciseId]` en setLogs, `[userId+exerciseId]` en personalRecords.

## Alcance de la Fase 1 (constrúyela completa antes de seguir)

1. **Biblioteca de ejercicios.** Precargada con unos 40 ejercicios comunes.
   Buscador, filtro por grupo muscular, y opción de crear ejercicios propios.
2. **Constructor de rutinas.** Crear una rutina, añadir ejercicios, reordenarlos
   arrastrando, definir series objetivo, rango de repeticiones y descanso.
3. **Modo entrenamiento** — la pantalla más importante de la app:
   - Muestra el ejercicio actual y las series pendientes como casillas
   - En la cabecera, el registro de la última vez con ese ejercicio
     (por ejemplo `80kg x 8, 8, 7 · hace 4 días`), **precargado** en los campos
   - Confirmar una serie es **un solo toque**
   - Al confirmar, arranca automáticamente el temporizador de descanso, que
     vibra y suena aunque la pantalla esté apagada
   - Campo de RPE opcional, nunca obligatorio
   - La sesión sobrevive a un cierre o recarga del navegador
4. **Historial y progreso.** Lista de sesiones pasadas, gráfica de peso por
   ejercicio en el tiempo, volumen semanal por grupo muscular, racha de días.
5. **Calendario semanal.** Qué toca hoy, qué se completó, qué se saltó.
6. **Progresión sugerida.** Al empezar un ejercicio, la app propone objetivo:
   si la última vez completaste todas las series en el rango alto de reps,
   sube el peso (2.5 kg en tren superior, 5 kg en tren inferior); si fallaste
   reps dos sesiones seguidas, baja un 10% y reconstruye. La sugerencia siempre
   es editable: nunca bloquees al usuario.

## Requisitos de interfaz

- **Modo oscuro por defecto.** Se usa en un gimnasio, con poca luz.
- **Objetivos táctiles de 48px mínimo.** Se usa con una sola mano y sudado.
- Diseño mobile-first; el escritorio es secundario.
- Cero diálogos de confirmación dentro del modo entrenamiento: usa deshacer.
- Estados vacíos que expliquen el siguiente paso, no ilustraciones decorativas.
- La app debe abrir y ser usable en menos de 2 segundos desde el icono del móvil.

## Reglas de código

- TypeScript `strict`, sin `any`.
- Los componentes no importan Dexie: solo repositorios.
- Cada repositorio expone funciones puras y tipadas
  (`getRoutinesByUser(userId)`, `logSet(input)`, ...) y es responsable de
  asignar `id`, `updatedAt` y de filtrar `deletedAt: null`.
- Una función `getCurrentUserId()` centralizada. En la Fase 1 devuelve
  `LOCAL_USER_ID`; en la Fase 2 devuelve el id de la sesión de Supabase. Ese
  es el único punto que cambia.
- Las migraciones de esquema de Dexie van versionadas desde la versión 1.
- Nombres de variables y comentarios en español; nombres de tablas, campos y
  tipos en inglés.

## Criterios de aceptación de la Fase 1

- Activo el modo avión, entreno una sesión completa, cierro el navegador,
  lo reabro: la sesión y todas las series siguen ahí.
- Registrar una serie con el peso sugerido cuesta exactamente un toque.
- Instalo la app en el móvil desde el navegador y aparece como icono propio.
- Ninguna consulta a una tabla personal se ejecuta sin filtrar por `userId`.
- Ninguna fila se borra físicamente de la base de datos.

## Fases siguientes (no las implementes todavía, solo no las bloquees)

**Fase 2 — Cuentas y sincronización.** Supabase Auth, esquema Postgres espejo
del de Dexie, Row Level Security filtrando por `auth.uid()`. Sincronización
bidireccional por `updatedAt` con estrategia "última escritura gana" y
propagación de `deletedAt`. Un botón de "crear cuenta" que sube al servidor
todo lo que ya existe en local reasignando `LOCAL_USER_ID` al id real.

**Fase 3 — Social del gimnasio.** Compartir una rutina mediante un código corto
que otro usuario canjea y copia a su cuenta; tabla de récords del gimnasio por
ejercicio; modo entrenador que asigna rutinas a clientes y ve su cumplimiento.

## Cómo quiero que trabajes

Empieza por el esquema de datos y la capa de repositorios, con los campos de
sincronización ya incluidos. Después el modo entrenamiento, que es el corazón
de la app. Lo demás va al final. No añadas funcionalidad que no esté en la
Fase 1, y si detectas una decisión que comprometería las fases 2 o 3,
dímelo antes de implementarla.
