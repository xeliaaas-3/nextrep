import type { ProveedorVideo } from "./types";

/**
 * Enlaces de vídeo de referencia.
 *
 * Solo se incrustan plataformas conocidas. Meter en un `iframe` cualquier URL
 * que alguien pegue es abrirle la puerta a que una página arbitraria se
 * ejecute dentro de la app, así que el resto se rechaza con un motivo claro en
 * lugar de intentarlo igualmente.
 */

export interface EnlaceReconocido {
  provider: ProveedorVideo;
  /** URL lista para el `iframe` o para el elemento `<video>`. */
  urlIncrustada: string;
  /** La URL original, para poder abrirla fuera de la app. */
  urlOriginal: string;
}

const EXTENSIONES_DIRECTAS = [".mp4", ".webm", ".ogg", ".ogv", ".mov"];

export function analizarEnlace(entrada: string): EnlaceReconocido | null {
  const texto = entrada.trim();
  if (texto === "") return null;

  let url: URL;
  try {
    // Sin esquema se asume https, que es lo que la gente pega.
    url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube: youtu.be/ID, /watch?v=ID, /shorts/ID, /embed/ID
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:shorts|embed|v)\/([\w-]{6,})/)?.[1] ??
      null;
    if (!id) return null;
    const inicio = segundosDeInicio(url);
    return {
      provider: "youtube",
      // El dominio sin cookies no deja rastro de publicidad en el dispositivo.
      urlIncrustada: `https://www.youtube-nocookie.com/embed/${id}${inicio ? `?start=${inicio}` : ""}`,
      urlOriginal: url.toString(),
    };
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).match(/^([\w-]{6,})/)?.[1];
    if (!id) return null;
    const inicio = segundosDeInicio(url);
    return {
      provider: "youtube",
      urlIncrustada: `https://www.youtube-nocookie.com/embed/${id}${inicio ? `?start=${inicio}` : ""}`,
      urlOriginal: url.toString(),
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,})/)?.[1];
    if (!id) return null;
    return {
      provider: "vimeo",
      urlIncrustada: `https://player.vimeo.com/video/${id}`,
      urlOriginal: url.toString(),
    };
  }

  // Archivo de vídeo servido directamente: se reproduce sin incrustar nada.
  const ruta = url.pathname.toLowerCase();
  if (EXTENSIONES_DIRECTAS.some((ext) => ruta.endsWith(ext))) {
    return { provider: "directo", urlIncrustada: url.toString(), urlOriginal: url.toString() };
  }

  return null;
}

/** `?t=90` o `?start=90` de YouTube, en segundos. */
function segundosDeInicio(url: URL): number | null {
  const bruto = url.searchParams.get("t") ?? url.searchParams.get("start");
  if (!bruto) return null;

  const soloNumero = Number(bruto.replace(/s$/, ""));
  if (Number.isFinite(soloNumero) && soloNumero > 0) return Math.floor(soloNumero);

  // Formatos tipo "1m30s".
  const m = bruto.match(/(?:(\d+)m)?(?:(\d+)s)?/);
  if (!m) return null;
  const total = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  return total > 0 ? total : null;
}

export function nombreProveedor(provider: ProveedorVideo): string {
  if (provider === "youtube") return "YouTube";
  if (provider === "vimeo") return "Vimeo";
  return "Enlace directo";
}
