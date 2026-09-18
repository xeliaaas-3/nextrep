/**
 * Utilidades de cliente para los vídeos e imágenes de referencia.
 *
 * Todo ocurre en el navegador: no se sube nada a ningún sitio.
 */

export interface DatosDelVideo {
  posterBlob: Blob | null;
  durationMs: number | null;
}

/**
 * Saca el primer fotograma de un vídeo y su duración.
 *
 * La miniatura se guarda aparte para poder pintar las listas sin descodificar
 * el vídeo entero, que en un móvil modesto se nota.
 */
export async function analizarVideo(archivo: Blob): Promise<DatosDelVideo> {
  const url = URL.createObjectURL(archivo);
  const video = document.createElement("video");

  try {
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    await esperarEvento(video, "loadeddata", 8000);

    const duracion = Number.isFinite(video.duration) ? video.duration : null;

    // Un pelín dentro del vídeo: el fotograma 0 suele salir en negro.
    video.currentTime = duracion ? Math.min(0.2, duracion / 2) : 0.1;
    await esperarEvento(video, "seeked", 8000).catch(() => undefined);

    const ancho = video.videoWidth || 0;
    const alto = video.videoHeight || 0;
    if (ancho === 0 || alto === 0) {
      return { posterBlob: null, durationMs: duracion ? Math.round(duracion * 1000) : null };
    }

    // Miniatura a 640px de ancho como mucho: no hace falta más para una lista.
    const escala = Math.min(1, 640 / ancho);
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);

    const contexto = lienzo.getContext("2d");
    if (!contexto) {
      return { posterBlob: null, durationMs: duracion ? Math.round(duracion * 1000) : null };
    }

    contexto.drawImage(video, 0, 0, lienzo.width, lienzo.height);
    const posterBlob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/jpeg", 0.72),
    );

    return { posterBlob, durationMs: duracion ? Math.round(duracion * 1000) : null };
  } catch {
    // Sin miniatura la app sigue funcionando: el vídeo se reproduce igual.
    return { posterBlob: null, durationMs: null };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

function esperarEvento(objetivo: HTMLElement, evento: string, msLimite: number): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const temporizador = window.setTimeout(() => {
      limpiar();
      rechazar(new Error(`Se agotó la espera de "${evento}"`));
    }, msLimite);

    const alOcurrir = () => {
      limpiar();
      resolver();
    };

    const alFallar = () => {
      limpiar();
      rechazar(new Error(`Error cargando el medio en "${evento}"`));
    };

    function limpiar() {
      window.clearTimeout(temporizador);
      objetivo.removeEventListener(evento, alOcurrir);
      objetivo.removeEventListener("error", alFallar);
    }

    objetivo.addEventListener(evento, alOcurrir, { once: true });
    objetivo.addEventListener("error", alFallar, { once: true });
  });
}

/** Segundos de un vídeo corto: "0:08". */
export function formatearDuracionMedia(ms: number | null): string | null {
  if (ms == null) return null;
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
