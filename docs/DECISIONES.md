# Decisiones de la Fase 1

Lo que se apartó del prompt ([docs/PROMPT.md](PROMPT.md)), y por qué. Todo lo
demás sigue el prompt al pie de la letra.

## 1. `userId` también en `setLogs` y `routineExercises`

**El prompt tenía una contradicción.** El principio 2 dice que "cada tabla de
datos personales lleva `userId`" y la sección de índices exige
`[userId+updatedAt]` **en cada tabla personal**. Pero la lista de campos de
`setLogs` y `routineExercises` no incluía `userId`.

Se resolvió a favor del principio y del índice: ambas tablas llevan `userId`
denormalizado desde su fila padre (la sesión y la rutina).

Sin ese campo:

- El índice obligatorio `[userId+updatedAt]` es imposible de declarar, y esa es
  justo la consulta que hará el sincronizador de la Fase 2 ("dame lo que cambió
  después de `lastSyncedAt` para este usuario").
- La Row Level Security de Postgres necesitaría un `JOIN` contra la tabla padre
  en cada fila, en la tabla que más escribe la app.
- Se rompería la regla de no consultar una tabla personal sin filtrar por
  `userId`.

Coste: el `userId` de una serie debe coincidir siempre con el de su sesión. Como
solo lo escribe el repositorio (`logSet` lo recibe y lo asigna), no hay forma de
que se desincronice desde la interfaz.

## 2. "Qué toca hoy" se resuelve por rotación, no por día de la semana

El prompt pide un calendario semanal que diga qué toca hoy, pero `routines` no
tiene ningún campo de día asignado. En vez de añadir uno, "hoy toca" es **la
siguiente rutina de la rotación**: la que sigue por `sortOrder` a la última que
se entrenó (`getNextRoutineIdInRotation`).

Es como funciona de verdad una rotación push / pull / pierna, no obliga a
entrenar en días fijos y no añade campos que el prompt no pedía. El calendario
semanal muestra lo que sí es un hecho: qué días se entrenó y cuáles no.

## 3. El precargado dentro de una sesión manda sobre la sugerencia

La sugerencia de progresión se calcula con el historial **excluyendo la sesión
en curso**. Aplicada tal cual, la serie 2 aparecía vacía después de registrar la
serie 1, y completar la serie 2 dejaba de costar un solo toque.

Regla aplicada: una serie pendiente se precarga con la última serie registrada
de ese ejercicio **en esta sesión**; solo la primera parte de la sugerencia.
Nadie cambia de peso entre la serie 1 y la 2.

## 4. Borrado suave también en la tabla derivada

`personalRecords` es un caché reconstruible, así que borrarlo físicamente al
recalcularlo habría sido inofensivo hoy. Se usa borrado suave igualmente: el
criterio de aceptación dice "ninguna fila se borra físicamente", y en la Fase 2
un borrado físico aquí no se podría propagar al servidor.

## 5. `useSyncExternalStore` en vez de efectos para el estado persistente

El React Compiler (activo en el linter de Next 16) prohíbe llamar a `setState`
dentro del cuerpo de un efecto. El estado que vive en `localStorage` —el
descanso en curso, si se muestra el RPE, los ejercicios añadidos a la sesión— se
lee con `useSyncExternalStore` sobre un pequeño almacén propio
(`src/lib/almacenLocal.ts`).

Ventaja añadida: durante el prerenderizado devuelve el valor inicial y en el
cliente el guardado, sin desajustes de hidratación.

Por el mismo motivo, las filas de series no sincronizan sus campos con un
efecto: el padre cambia la `key` cuando cambia el ejercicio, la unidad o el
valor precargado, y la fila se vuelve a montar con los valores nuevos.

## 6. La siembra del catálogo es atómica

La comprobación "¿está vacía la tabla?" y la inserción van dentro de la misma
transacción de Dexie. En desarrollo React monta los efectos dos veces y, con la
comprobación fuera de la transacción, las dos llamadas veían la tabla vacía y el
catálogo acababa duplicado. Se detectó probando la app, no leyendo el código.

## 7. Lectura y escritura separadas en los ajustes

Dexie no permite abrir una transacción de escritura dentro de un `liveQuery`.
Por eso `getSettings` es de solo lectura (y es la que usan las pantallas) y
`ensureSettings` escribe, llamada una sola vez desde `ArranqueApp`.

## 8. El manifiesto y las cabeceras del service worker siguen la guía de Next

Primero se escribieron a mano: `public/manifest.webmanifest` y el
`<link rel="manifest">` declarado en `metadata`. La guía de PWA de esta versión
(`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`) marca
otro camino, que es el que está ahora:

- El manifiesto es `src/app/manifest.ts`, una convención de archivo: el objeto
  va tipado con `MetadataRoute.Manifest`, se sirve en `/manifest.webmanifest` y
  Next inserta la etiqueta `<link>` por su cuenta.
- `/sw.js` se sirve con `Cache-Control: no-cache, no-store, must-revalidate`.
  Sin esa cabecera el navegador puede quedarse con un service worker viejo y la
  app deja de recibir actualizaciones. Esto era un fallo real, no un detalle de
  estilo.

De las cabeceras globales que sugiere la guía se aplican `X-Content-Type-Options`
y `Referrer-Policy`. Falta `X-Frame-Options: DENY`, que conviene añadir al
desplegar: aquí se dejó fuera para no romper la vista previa incrustada con la
que se probó la app.

## 9. La interfaz sigue el sistema "High-Velocity Athletic Utility"

El diseño de [docs/DESIGN.md](DESIGN.md) se aplicó entero: carbón con una pizca
de violeta, púrpura de marca como único acento de acción, azul para analítica y
RPE, Space Grotesk para cifras y titulares, Geist para el texto, radios cortos
(4px en chips, 8px en tarjetas), columna de 480px y zona inferior fija.

Dos cosas del mockup NO se copiaron, a propósito:

- **Material Symbols desde el CDN de Google.** Un icon font externo deja la app
  sin iconos en cuanto no hay cobertura, que es justo cuando se usa. Los iconos
  son SVG en línea.
- **Tailwind desde el CDN.** Compila en el navegador en cada carga. Se usa el
  Tailwind del proyecto.

Las fuentes sí se adoptaron, pero por `next/font`, que las auto-aloja.

Del mockup tampoco se copió lo que no tiene datos detrás: la foto de gimnasio,
el saludo con nombre, el recordatorio de técnica de portada y el "94% de
adherencia". Lo que se pinta sale de la base: duración, series, volumen,
récords, 1RM estimada, distribución por grupo y racha.

## 10. Registrar una serie: tabla fija y un botón grande abajo

La pantalla de entrenamiento pasó de filas editables a la arquitectura del
diseño: columnas fijas SERIE · TIPO · CARGA · REPS · ESTADO, solo la serie
activa desplegada con steppers de − y +, selector de RPE, y un botón fijo abajo
que dice exactamente lo que va a registrar.

Los steppers no son decorativos: abrir el teclado del móvil entre series, con
las manos ocupadas, es lo que hay que evitar. Aun así el campo se puede tocar y
escribir, porque para un salto de 20 kg el teclado es más rápido.

## 11. Marca NextRep

La app se llama NextRep. La paleta sale del logo: púrpura `#9013e8`, blanco roto
`#edede9` y carbón `#3f3f3f`.

El púrpura lleva **dos tonos** y no uno. Sobre el púrpura pleno el blanco roto
da 5,2:1, que pasa de sobra; pero ese mismo púrpura *como texto* sobre el carbón
se queda en 3,2:1 y no llega al mínimo legible. Por eso `--acento` es para
rellenos y `--acento-texto` (`#c08cf7`, 7,8:1) para texto.

El isotipo está en `src/components/Logo.tsx` como SVG en línea: pesa nada,
escala sin perder filo, se ve sin conexión y usa tokens, así que también
funciona en tema claro. Los PNG del icono los genera `scripts/generar-marca.mjs`
con el mismo cálculo de arcos, así que las dos versiones no pueden
desalinearse.

## 12. Referencias de técnica: archivo propio o enlace

Cada ejercicio puede llevar una referencia, y hay dos formas de guardarla
porque resuelven cosas distintas:

- **Archivo propio** (vídeo de hasta 30 s o imagen): se guarda como `Blob`
  dentro de IndexedDB. Ocupa espacio, pero **se ve en el sótano del gimnasio**,
  que es donde de verdad se consulta la técnica.
- **Enlace** de YouTube, Vimeo o un vídeo servido directamente: se guarda solo
  la URL. Se añade en dos segundos y no ocupa nada, pero **necesita conexión**.

La interfaz lo dice sin rodeos en cada ficha ("Guardado sin conexión" frente a
"Necesita conexión"), porque descubrir que tu referencia no carga justo antes de
una serie pesada es el peor momento posible.

Solo se incrustan plataformas reconocidas (`src/lib/enlaces.ts`). Meter en un
`iframe` cualquier URL pegada es dejar que una página arbitraria se ejecute
dentro de la app; lo que no se reconoce se rechaza con el motivo. YouTube va por
`youtube-nocookie.com` y el `iframe` lleva `sandbox`.

Una referencia por ejercicio: entre series hace falta una referencia, no una
galería. La tabla admite varias, así que ampliarlo es quitar el reemplazo.

---

## Limitación conocida: el aviso de descanso con la pantalla apagada

El prompt pide que el temporizador "vibre y suene aunque la pantalla esté
apagada". Eso no depende del código: los navegadores limitan los temporizadores
de las pestañas en segundo plano, y no hay forma de programar una alarma local
sin un servidor de notificaciones push.

Lo que hace la app:

- La cuenta atrás se deriva de una **marca de tiempo absoluta**, no de un
  contador que va sumando. Aunque el navegador congele la pestaña, al volver el
  tiempo que se ve es el correcto.
- Al llegar a cero dispara a la vez **sonido** (Web Audio, preparado en el toque
  que confirma la serie), **vibración** y **notificación** a través del service
  worker, que es la vía que sigue funcionando en segundo plano en Android.
- Mientras dura el entrenamiento pide un **wake lock** para que la pantalla no
  se apague sola.

Con la app en primer plano el aviso es fiable. Con la pantalla apagada llega en
la mayoría de los casos en Android con las notificaciones concedidas, y puede
retrasarse en iOS. La cuenta atrás, en cambio, siempre es exacta.
