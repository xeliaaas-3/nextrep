import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA.
 *
 * Va como convención de archivo de Next (`app/manifest.ts`) y no como un
 * archivo suelto en `public/`: así el objeto está tipado, se sirve en
 * `/manifest.webmanifest` y Next inserta solo la etiqueta `<link rel="manifest">`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NextRep",
    short_name: "NextRep",
    description: "Registra tus series mientras entrenas. Funciona sin conexión.",
    lang: "es",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0a0e",
    theme_color: "#0b0a0e",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        // Fondo a sangre para que Android pueda recortarlo con cualquier forma.
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Entrenar ahora",
        short_name: "Entrenar",
        url: "/entrenar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
