"use client";

import { useRef, useState } from "react";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { analizarVideo, formatearDuracionMedia } from "@/lib/medios";
import { media as repoMedia } from "@/lib/repositories";
import type { Exercise } from "@/lib/types";
import { useAvisos } from "../Avisos";
import { nombreProveedor } from "@/lib/enlaces";
import { IconoBasura, IconoCerrar, IconoImagen, IconoReproducir, IconoVideo } from "../iconos";
import { Boton, Campo, Rotulo, juntar } from "../ui";
import { VisorMedia } from "./VisorMedia";

/**
 * Referencia de técnica de un ejercicio: un vídeo corto o una imagen.
 *
 * Se abre desde la biblioteca y desde el propio entrenamiento, que es cuando
 * de verdad hace falta: te plantas delante de la barra y no recuerdas si el
 * codo iba pegado.
 */
export function HojaMedia({
  ejercicio,
  alCerrar,
}: {
  ejercicio: Exercise;
  alCerrar: () => void;
}) {
  const userId = useUsuarioActual();
  const { avisar } = useAvisos();
  const entrada = useRef<HTMLInputElement>(null);

  const [guardando, setGuardando] = useState(false);
  const [notas, setNotas] = useState<string | null>(null);
  const [enlace, setEnlace] = useState("");
  const [errorEnlace, setErrorEnlace] = useState<string | undefined>();

  const media = useDatos(
    () => repoMedia.getMediaForExercise(userId, ejercicio.id),
    [userId, ejercicio.id],
  );

  async function alElegirArchivo(archivo: File) {
    setGuardando(true);
    try {
      const esVideo = archivo.type.startsWith("video/");
      const datos = esVideo
        ? await analizarVideo(archivo)
        : { posterBlob: null, durationMs: null };

      await repoMedia.saveMedia(userId, ejercicio.id, {
        archivo,
        mimeType: archivo.type,
        posterBlob: datos.posterBlob,
        durationMs: datos.durationMs,
        notes: media?.notes ?? "",
      });

      avisar({ mensaje: "Referencia guardada en este dispositivo", tono: "exito" });
    } catch (error) {
      avisar({
        mensaje:
          error instanceof repoMedia.ErrorMedia
            ? error.message
            : "No se pudo guardar el archivo.",
        tono: "peligro",
      });
    } finally {
      setGuardando(false);
      // Permite volver a elegir el mismo archivo si algo falló.
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function guardarEnlace() {
    setGuardando(true);
    try {
      await repoMedia.saveLink(userId, ejercicio.id, enlace, media?.notes ?? "");
      setEnlace("");
      setErrorEnlace(undefined);
      avisar({ mensaje: "Enlace guardado", tono: "exito" });
    } catch (error) {
      setErrorEnlace(
        error instanceof repoMedia.ErrorMedia ? error.message : "No se pudo guardar el enlace.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!media) return;
    const id = media.id;
    await repoMedia.deleteMedia(id);
    avisar({
      mensaje: "Referencia eliminada",
      accion: { etiqueta: "Deshacer", alPulsar: () => void repoMedia.restoreMedia(id) },
    });
  }

  const notasEnEdicion = notas ?? media?.notes ?? "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 lg:items-center lg:justify-center lg:p-6">
      <button type="button" aria-label="Cerrar" className="flex-1 lg:absolute lg:inset-0" onClick={alCerrar} />

      <div className="animar-subir flex max-h-[88vh] flex-col rounded-t-2xl border-t lg:w-full lg:max-w-lg lg:rounded-2xl lg:border border-borde-fuerte bg-superficie-2 shadow-[var(--sombra-modal)]">
        <div className="flex items-center gap-2 border-b border-borde px-4 py-3">
          <div className="min-w-0 flex-1">
            <Rotulo>Referencia de técnica</Rotulo>
            <h2 className="titulo-sm mt-0.5 truncate">{ejercicio.name}</h2>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="tactil grid place-items-center rounded-lg text-suave active:bg-superficie-3"
          >
            <IconoCerrar />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {media ? (
            <>
              <VisorMedia media={media} className="max-h-[46vh]" />

              <div className="flex flex-wrap items-center gap-2 text-suave">
                <span className="etiqueta-caps inline-flex items-center gap-1.5 rounded border border-borde bg-superficie px-2 py-1">
                  {media.kind === "image" ? (
                    <IconoImagen width={14} height={14} />
                  ) : media.kind === "enlace" ? (
                    <IconoReproducir width={14} height={14} />
                  ) : (
                    <IconoVideo width={14} height={14} />
                  )}
                  {media.kind === "image"
                    ? "Imagen"
                    : media.kind === "enlace"
                      ? nombreProveedor(media.provider ?? "directo")
                      : "Vídeo"}
                </span>

                {formatearDuracionMedia(media.durationMs) && (
                  <span className="etiqueta-caps">{formatearDuracionMedia(media.durationMs)}</span>
                )}
                {media.sizeBytes > 0 && (
                  <span className="etiqueta-caps">
                    {repoMedia.formatearTamano(media.sizeBytes)}
                  </span>
                )}

                {/*
                  La diferencia que más importa: un archivo se ve en el sótano
                  del gimnasio; un enlace, no. Se dice sin rodeos.
                */}
                <span
                  className={juntar(
                    "etiqueta-caps",
                    media.kind === "enlace" ? "text-aviso" : "text-acento-texto",
                  )}
                >
                  {media.kind === "enlace" ? "Necesita conexión" : "Guardado sin conexión"}
                </span>
              </div>

              <label className="block">
                <span className="etiqueta-caps mb-2 block text-suave">Nota de técnica</span>
                <textarea
                  rows={3}
                  value={notasEnEdicion}
                  maxLength={300}
                  placeholder="Escápulas retraídas, pausa de 1 segundo en el pecho..."
                  onChange={(e) => setNotas(e.target.value)}
                  onBlur={() => {
                    if (notas !== null && notas !== media.notes) {
                      void repoMedia.updateMediaNotes(media.id, notas);
                    }
                  }}
                  className="w-full resize-none rounded-lg border border-borde-fuerte bg-superficie px-3 py-2.5 text-sm outline-none focus:border-acento"
                />
              </label>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-borde-fuerte px-6 py-8 text-center">
              <p className="titulo-sm">Sin referencia todavía</p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-suave">
                Graba un vídeo tuyo o guarda una imagen, y lo tendrás disponible sin cobertura.
                O pega un enlace de YouTube si solo quieres ver cómo se hace.
              </p>
            </div>
          )}
        </div>

        <div
          className="space-y-2 border-t border-borde p-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <input
            ref={entrada}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void alElegirArchivo(archivo);
            }}
          />

          <Boton
            variante="primario"
            ancho
            disabled={guardando}
            onClick={() => entrada.current?.click()}
          >
            <IconoVideo width={18} height={18} />
            {guardando ? "Guardando..." : media ? "Sustituir por un archivo" : "Grabar o subir archivo"}
          </Boton>

          <p className="text-center text-xs text-suave">
            Vídeo hasta 30 MB y 1 minuto · imagen hasta 8 MB · se ve sin conexión
          </p>

          {/* Segunda vía: un enlace de internet. Rápido, pero no vale offline. */}
          <div className="border-t border-borde pt-3">
            <Campo
              etiqueta="O pega un enlace de vídeo"
              placeholder="youtube.com/watch?v=..."
              inputMode="url"
              value={enlace}
              error={errorEnlace}
              ayuda="YouTube, Vimeo o la dirección de un archivo de vídeo."
              onChange={(e) => {
                setEnlace(e.target.value);
                setErrorEnlace(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && enlace.trim() !== "") void guardarEnlace();
              }}
            />
            <Boton
              ancho
              className="mt-2"
              disabled={guardando || enlace.trim() === ""}
              onClick={() => void guardarEnlace()}
            >
              <IconoReproducir width={16} height={16} />
              Guardar enlace
            </Boton>
          </div>

          {media && (
            <Boton variante="peligro" ancho onClick={() => void borrar()}>
              <IconoBasura width={18} height={18} />
              Eliminar referencia
            </Boton>
          )}
        </div>
      </div>
    </div>
  );
}
