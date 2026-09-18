"use client";

import { useCallback } from "react";
import type { ExerciseMedia } from "@/lib/types";
import { IconoReproducir } from "../iconos";
import { juntar } from "../ui";

/**
 * Pinta una referencia de técnica, sea un archivo guardado o un enlace.
 *
 * Las URLs de objeto de los `Blob` se crean y se liberan en un callback ref con
 * función de limpieza (React 19). Así el navegador nunca se queda con URLs
 * colgando —que con vídeos de decenas de megas se nota— y no hace falta ningún
 * efecto que sincronice estado.
 */
function useImagenBlob(blob: Blob | null | undefined) {
  return useCallback(
    (elemento: HTMLImageElement | null) => {
      if (!elemento || !blob) return;

      const url = URL.createObjectURL(blob);
      elemento.src = url;

      return () => URL.revokeObjectURL(url);
    },
    [blob],
  );
}

/** Miniatura para listas: el póster del vídeo o la propia imagen. */
export function MiniaturaMedia({
  media,
  className,
}: {
  media: ExerciseMedia;
  className?: string;
}) {
  const fuente = useImagenBlob(media.kind === "image" ? media.blob : media.posterBlob);

  // Un enlace o un vídeo sin póster no tienen nada que enseñar todavía.
  if (media.kind === "enlace" || (media.kind === "video" && !media.posterBlob)) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- El origen es un Blob local; `next/image` no puede optimizar eso.
    <img ref={fuente} alt="" aria-hidden className={juntar("size-full object-cover", className)} />
  );
}

/**
 * Visor a tamaño completo.
 *
 * El vídeo propio va en bucle, silenciado y en línea: es una referencia de
 * técnica que se mira dos segundos entre series, no un contenido que se
 * "reproduce".
 */
export function VisorMedia({ media, className }: { media: ExerciseMedia; className?: string }) {
  const montarImagen = useImagenBlob(media.kind === "image" ? media.blob : null);

  const montarVideo = useCallback(
    (elemento: HTMLVideoElement | null) => {
      if (!elemento || media.kind !== "video" || !media.blob) return;

      const urls: string[] = [];

      const fuente = URL.createObjectURL(media.blob);
      urls.push(fuente);
      elemento.src = fuente;

      if (media.posterBlob) {
        const poster = URL.createObjectURL(media.posterBlob);
        urls.push(poster);
        elemento.poster = poster;
      }

      return () => {
        for (const url of urls) URL.revokeObjectURL(url);
      };
    },
    [media],
  );

  if (media.kind === "enlace" && media.url) {
    // Un archivo servido directamente no necesita incrustar nada de terceros.
    if (media.provider === "directo") {
      return (
        <video
          src={media.url}
          className={juntar("w-full rounded-lg bg-black object-contain", className)}
          controls
          loop
          muted
          playsInline
          preload="metadata"
        />
      );
    }

    return (
      <div className={juntar("relative w-full overflow-hidden rounded-lg bg-black", className)}>
        <div className="aspect-video w-full">
          <iframe
            src={media.url}
            title="Vídeo de referencia del ejercicio"
            className="size-full"
            // El reproductor externo va en la caja más cerrada que admite:
            // sin acceso a la app que lo contiene y sin permisos de sensores.
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  if (media.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Ídem: es un Blob local.
      <img
        ref={montarImagen}
        alt="Referencia de técnica del ejercicio"
        className={juntar("w-full rounded-lg object-contain", className)}
      />
    );
  }

  return (
    <video
      ref={montarVideo}
      className={juntar("w-full rounded-lg bg-black object-contain", className)}
      controls
      loop
      muted
      playsInline
      preload="metadata"
    />
  );
}

/** Distintivo para las listas cuando la referencia es un enlace, sin póster. */
export function IndicadorEnlace() {
  return (
    <span className="grid size-full place-items-center bg-superficie-3 text-acento-texto">
      <IconoReproducir width={16} height={16} />
    </span>
  );
}
