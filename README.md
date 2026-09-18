# NextRep

App web para registrar rutinas de gimnasio. Funciona sin conexión, se instala
en el móvil como una app más y te precarga el peso y las repeticiones de la
última vez para que completar una serie cueste un solo toque.

Fase 1: la usa un solo usuario, sin cuentas ni servidor. El modelo de datos ya
está preparado para la Fase 2 (cuentas y sincronización) sin reescribir nada.

## Arrancar

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:3000>. El catálogo de 48 ejercicios se siembra solo la
primera vez.

Para probar la instalación como PWA y el modo offline hace falta una compilación
de producción, porque el service worker no se registra en desarrollo:

```bash
npm run build && npm start
```

## Estructura

```
src/
  app/                  Rutas (Next.js App Router)
    manifest.ts         Manifiesto de la PWA (convención de archivo de Next)
    page.tsx            Hoy: qué toca, semana, racha, volumen
    entrenar/           Elegir rutina y modo entrenamiento
    rutinas/            Lista y editor de rutinas
    ejercicios/         Biblioteca del catálogo y referencias
    historial/          Sesiones pasadas y resumen de cada una
    progreso/           Evolución, volumen y récords
    mas/                Historial, biblioteca y ajustes
    ajustes/            Unidad, descanso, tema, notificaciones
  components/
    Logo.tsx            Isotipo y logotipo en SVG
    entrenamiento/      Tabla de series, editor y descanso
    media/              Vídeos e imágenes de referencia
  lib/
    db.ts               Esquema de Dexie (IndexedDB)
    repositories/       ÚNICO acceso a la base
    types.ts            Tipos del dominio
    progression.ts      Reglas de progresión
    enlaces.ts          Enlaces de vídeo que se pueden incrustar
    auth.ts             getCurrentUserId()
scripts/
  generar-marca.mjs     Genera los PNG del icono y las rutas SVG del logo
```

## Las reglas que sostienen el diseño

1. **IndexedDB es la fuente de verdad.** La app entera funciona sin conexión.
   La nube de la Fase 2 será respaldo y sincronización, nunca un requisito para
   entrenar.
2. **Cada tabla personal lleva `userId`**, aunque hoy siempre valga
   `LOCAL_USER_ID`. Ninguna consulta a una tabla personal se ejecuta sin
   filtrarlo.
3. **IDs UUID v4 generados en el cliente.** Dos dispositivos creando registros
   sin conexión no pueden colisionar.
4. **Toda fila lleva `createdAt`, `updatedAt` y `deletedAt`.** El borrado es
   siempre suave. Sin eso la sincronización sería imposible.
5. **Los componentes nunca importan Dexie.** Pasan por
   `src/lib/repositories`, así que añadir sincronización no tocará la interfaz.
6. **`getCurrentUserId()` es el único punto que cambia en la Fase 2.**

## Referencias de técnica

Cada ejercicio puede llevar un vídeo o una imagen de cómo se hace, y se abre
desde el propio entrenamiento con el botón que hay junto al nombre. Hay dos
formas de guardarla:

- **Un archivo tuyo** (vídeo de hasta 30 s o una imagen). Se guarda en el
  dispositivo, así que **se ve sin cobertura**.
- **Un enlace** de YouTube, Vimeo o un vídeo directo. Se añade en dos segundos y
  no ocupa nada, pero **necesita conexión**.

La app lo marca en cada ficha para que sepas con cuál cuentas antes de bajar al
sótano del gimnasio.

## Cómo progresa la app sola

Al abrir un ejercicio verás lo que hiciste la última vez y una propuesta para
hoy, siempre editable:

- Completaste todas las series en el tope del rango → sube el peso (+2,5 kg en
  tren superior, +5 kg en tren inferior).
- Dos sesiones seguidas sin llegar al mínimo del rango → descarga del 10%.
- En cualquier otro caso → mismo peso, una repetición más.

## Comprobar que todo sigue en pie

```bash
npm run build && npx eslint .
```

## Más documentación

- [docs/PROMPT.md](docs/PROMPT.md) — la especificación de la que salió esto.
- [docs/DESIGN.md](docs/DESIGN.md) — el sistema visual: paleta, tipografía,
  elevación y especificación de cada componente.
- [docs/DECISIONES.md](docs/DECISIONES.md) — dónde y por qué se apartó de ella,
  y la limitación conocida del aviso de descanso con la pantalla apagada.

`AGENTS.md` y `CLAUDE.md` los genera `next dev` y conviene dejarlos en el
repositorio: apuntan a la documentación de esta versión de Next, que está en
`node_modules/next/dist/docs/`.
