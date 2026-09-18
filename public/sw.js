/*
 * Service worker.
 *
 * Solo se ocupa de que la app ARRANQUE sin conexión: cachea el caparazón
 * (HTML, JS, CSS, iconos). Los datos del entrenamiento no pasan por aquí,
 * viven en IndexedDB, que ya es la fuente de verdad.
 */

const CACHE = "gym-v1";

const ESENCIALES = [
  "/",
  "/entrenar",
  "/rutinas",
  "/progreso",
  "/historial",
  "/ajustes",
  "/ejercicios",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Una ruta que falle no debe tumbar la instalación entera.
      await Promise.allSettled(ESENCIALES.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones: primero la red, y si no hay, lo último que se cacheó.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      (async () => {
        try {
          const respuesta = await fetch(peticion);
          const cache = await caches.open(CACHE);
          cache.put(peticion, respuesta.clone());
          return respuesta;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(peticion)) ?? (await cache.match("/")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Recursos estáticos: se sirve lo cacheado y se refresca por detrás.
  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cacheada = await cache.match(peticion);

      const red = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) cache.put(peticion, respuesta.clone());
          return respuesta;
        })
        .catch(() => null);

      return cacheada ?? (await red) ?? Response.error();
    })(),
  );
});

// Al tocar el aviso de descanso, volver a la app en vez de abrir otra pestaña.
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  evento.waitUntil(
    (async () => {
      const clientes = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const abierto = clientes.find((c) => c.url.includes(self.location.origin));
      if (abierto) return abierto.focus();
      return self.clients.openWindow("/");
    })(),
  );
});
