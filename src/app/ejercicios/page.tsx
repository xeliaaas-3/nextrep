"use client";

import { useState } from "react";
import { useAvisos } from "@/components/Avisos";
import { IconoBasura, IconoBuscar, IconoMas, IconoReproducir, IconoVideo } from "@/components/iconos";
import { HojaMedia } from "@/components/media/HojaMedia";
import { IndicadorEnlace, MiniaturaMedia } from "@/components/media/VisorMedia";
import { Boton, Cabecera, Campo, Cargando, Filtros } from "@/components/ui";
import { COLOR_GRUPO, etiquetaEquipo, etiquetaGrupo } from "@/lib/format";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { ejercicios as repoEjercicios, media as repoMedia } from "@/lib/repositories";
import {
  EQUIPOS,
  GRUPOS_MUSCULARES,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from "@/lib/types";

/** Biblioteca de ejercicios: el catálogo común más los que crea el usuario. */
export default function PaginaEjercicios() {
  const userId = useUsuarioActual();
  const { avisar } = useAvisos();

  const [texto, setTexto] = useState("");
  const [grupo, setGrupo] = useState<MuscleGroup | "todos">("todos");
  const [creando, setCreando] = useState(false);
  const [conMedia, setConMedia] = useState<Exercise | null>(null);

  const [nombre, setNombre] = useState("");
  const [grupoNuevo, setGrupoNuevo] = useState<MuscleGroup>("pecho");
  const [equipoNuevo, setEquipoNuevo] = useState<Equipment>("barra");
  const [error, setError] = useState<string | undefined>();

  const resultados = useDatos(
    () => repoEjercicios.searchExercises(userId, texto, grupo),
    [userId, texto, grupo],
  );

  const referencias = useDatos(() => repoMedia.getMediaMapForUser(userId), [userId]);

  async function crear() {
    const limpio = nombre.trim();
    if (limpio === "") {
      setError("El nombre es obligatorio");
      return;
    }

    await repoEjercicios.createCustomExercise(userId, {
      name: limpio,
      muscleGroup: grupoNuevo,
      equipment: equipoNuevo,
    });

    setNombre("");
    setCreando(false);
    setError(undefined);
    avisar({ mensaje: `"${limpio}" añadido a tu biblioteca`, tono: "exito" });
  }

  async function borrar(id: string, nombreEjercicio: string) {
    await repoEjercicios.deleteCustomExercise(id, userId);
    avisar({ mensaje: `"${nombreEjercicio}" eliminado` });
  }

  return (
    <>
      <Cabecera
        titulo="Ejercicios"
        atras="/mas"
        accion={
          <Boton
            variante="primario"
            onClick={() => setCreando((v) => !v)}
            aria-label="Crear ejercicio"
          >
            <IconoMas width={20} height={20} />
          </Boton>
        }
      />

      <div className="space-y-3 px-4">
        {creando && (
          <div className="animar-aparecer space-y-3 rounded-lg border border-borde bg-superficie p-4">
            <Campo
              etiqueta="Nombre"
              autoFocus
              placeholder="Remo en máquina"
              value={nombre}
              error={error}
              onChange={(e) => {
                setNombre(e.target.value);
                setError(undefined);
              }}
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-suave">Grupo muscular</span>
              <select
                value={grupoNuevo}
                onChange={(e) => setGrupoNuevo(e.target.value as MuscleGroup)}
                className="tactil w-full rounded-lg border border-borde bg-superficie-2 px-3 outline-none focus:border-acento"
              >
                {GRUPOS_MUSCULARES.map((g) => (
                  <option key={g} value={g}>
                    {etiquetaGrupo(g)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-suave">Material</span>
              <select
                value={equipoNuevo}
                onChange={(e) => setEquipoNuevo(e.target.value as Equipment)}
                className="tactil w-full rounded-lg border border-borde bg-superficie-2 px-3 outline-none focus:border-acento"
              >
                {EQUIPOS.map((eq) => (
                  <option key={eq} value={eq}>
                    {etiquetaEquipo(eq)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Boton className="flex-1" onClick={() => setCreando(false)}>
                Cancelar
              </Boton>
              <Boton variante="primario" className="flex-1" onClick={() => void crear()}>
                Crear
              </Boton>
            </div>
          </div>
        )}

        <div className="relative">
          <IconoBuscar
            width={18}
            height={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave"
          />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar ejercicio"
            className="tactil w-full rounded-lg border border-borde bg-superficie-2 pl-10 pr-3 outline-none focus:border-acento"
          />
        </div>

        <Filtros
          valor={grupo}
          alCambiar={setGrupo}
          opciones={[
            { valor: "todos" as const, etiqueta: "Todos" },
            ...GRUPOS_MUSCULARES.map((g) => ({ valor: g, etiqueta: etiquetaGrupo(g) })),
          ]}
        />

        {!resultados ? (
          <Cargando />
        ) : (
          <ul className="space-y-1">
            {resultados.length === 0 && (
              <li className="py-10 text-center text-sm text-suave">
                No hay ejercicios que coincidan.
              </li>
            )}

            {resultados.map((ejercicio) => {
              const referencia = referencias?.get(ejercicio.id);

              return (
                <li
                  key={ejercicio.id}
                  className="flex items-center gap-3 rounded-lg border border-borde bg-superficie px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: COLOR_GRUPO[ejercicio.muscleGroup] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{ejercicio.name}</span>
                    <span className="block text-xs text-suave">
                      {etiquetaGrupo(ejercicio.muscleGroup)} ·{" "}
                      {etiquetaEquipo(ejercicio.equipment)}
                      {ejercicio.isCustom && " · tuyo"}
                    </span>
                  </span>

                  {/* Referencia de técnica: la miniatura ya adelanta si la hay. */}
                  <button
                    type="button"
                    onClick={() => setConMedia(ejercicio)}
                    aria-label={
                      referencia
                        ? `Ver la referencia de ${ejercicio.name}`
                        : `Añadir una referencia a ${ejercicio.name}`
                    }
                    className="tactil relative grid shrink-0 place-items-center overflow-hidden rounded border border-borde bg-superficie-2 text-suave active:bg-superficie-3"
                  >
                    {!referencia ? (
                      <IconoVideo width={18} height={18} />
                    ) : referencia.kind === "enlace" ? (
                      <IndicadorEnlace />
                    ) : (
                      <>
                        <MiniaturaMedia media={referencia} className="absolute inset-0" />
                        <span className="relative grid size-full place-items-center bg-black/35 text-white">
                          <IconoReproducir width={16} height={16} />
                        </span>
                      </>
                    )}
                  </button>

                  {ejercicio.isCustom && (
                    <button
                      type="button"
                      onClick={() => void borrar(ejercicio.id, ejercicio.name)}
                      aria-label={`Eliminar ${ejercicio.name}`}
                      className="tactil grid shrink-0 place-items-center rounded-lg px-2 text-suave active:bg-superficie-2"
                    >
                      <IconoBasura width={18} height={18} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {conMedia && <HojaMedia ejercicio={conMedia} alCerrar={() => setConMedia(null)} />}
    </>
  );
}
