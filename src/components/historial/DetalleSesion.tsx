"use client";

import { useRouter } from "next/navigation";
import {
  COLOR_GRUPO,
  etiquetaGrupo,
  formatearPeso,
  formatearSerie,
  formatearVolumen,
  numeroCorto,
  plural,
} from "@/lib/format";
import { useAjustes, useDatos, useUsuarioActual } from "@/lib/hooks";
import {
  ejercicios as repoEjercicios,
  estadisticas as repoEstadisticas,
  records as repoRecords,
  rutinas as repoRutinas,
  series as repoSeries,
  sesiones as repoSesiones,
} from "@/lib/repositories";
import { formatearDuracion, formatearFecha, formatearHora } from "@/lib/time";
import type { MuscleGroup, UUID } from "@/lib/types";
import { useAvisos } from "../Avisos";
import { IconoBasura, IconoRayo, IconoTrofeo } from "../iconos";
import { Boton, Cabecera, Cargando, Rotulo, Tarjeta, juntar } from "../ui";

/**
 * Resumen de la sesión: es a la vez la pantalla a la que se llega al terminar
 * de entrenar y la ficha de cualquier entrenamiento del historial.
 *
 * Todo lo que sale aquí está calculado con datos reales. No hay porcentajes de
 * adherencia ni objetivos inventados: un número que no significa nada acaba
 * enseñando a ignorar los que sí.
 */
export function DetalleSesion({ sessionId }: { sessionId: UUID }) {
  const userId = useUsuarioActual();
  const router = useRouter();
  const { avisar } = useAvisos();
  const { unit } = useAjustes();

  const datos = useDatos(async () => {
    const sesion = await repoSesiones.getSessionById(sessionId, userId);
    if (!sesion) return null;

    const rutina = sesion.routineId
      ? await repoRutinas.getRoutineById(sesion.routineId, userId)
      : null;
    const porEjercicio = await repoSeries.getSetLogsBySessionGrouped(sessionId);
    const catalogo = await repoEjercicios.getExercisesByIds([...porEjercicio.keys()]);
    const volumen = repoEstadisticas.calcularVolumen([...porEjercicio.values()].flat());

    // Un récord "de esta sesión" es el que se logró entre su inicio y su fin.
    const marcas = await repoRecords.getPersonalRecords(userId);
    const desde = sesion.startedAt;
    const hasta = sesion.finishedAt ?? new Date().toISOString();
    const recordsDeHoy = [...marcas.values()].filter(
      (m) => m.achievedAt >= desde && m.achievedAt <= hasta,
    );

    // Reparto del volumen por grupo muscular dentro de esta sesión.
    const porGrupo = new Map<MuscleGroup, number>();
    for (const [exerciseId, series] of porEjercicio) {
      const grupo = catalogo.get(exerciseId)?.muscleGroup;
      if (!grupo) continue;
      const suma = series
        .filter((s) => !s.isWarmup)
        .reduce((total, s) => total + s.weightKg * s.reps, 0);
      porGrupo.set(grupo, (porGrupo.get(grupo) ?? 0) + suma);
    }

    return {
      sesion,
      rutina,
      porEjercicio,
      catalogo,
      volumen,
      recordsDeHoy,
      grupos: [...porGrupo.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [sessionId, userId]);

  if (datos === undefined) return <Cargando />;

  if (datos === null) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="titulo-sm">Esta sesión ya no existe</p>
        <Boton className="mt-4" onClick={() => router.replace("/historial")}>
          Volver al historial
        </Boton>
      </div>
    );
  }

  const { sesion, rutina, porEjercicio, catalogo, volumen, recordsDeHoy, grupos } = datos;
  const efectivas = [...porEjercicio.values()].flat().filter((s) => !s.isWarmup);
  const enCurso = sesion.finishedAt === null;

  const duracionMin = sesion.finishedAt
    ? Math.max(
        1,
        Math.round(
          (new Date(sesion.finishedAt).getTime() - new Date(sesion.startedAt).getTime()) / 60000,
        ),
      )
    : null;

  // Ritmo: cuánto se tarda por serie. Delata si la sesión se fue en el móvil.
  const ritmo =
    duracionMin && efectivas.length > 0
      ? Math.round((duracionMin / efectivas.length) * 10) / 10
      : null;

  const volumenTotalGrupos = grupos.reduce((total, [, kg]) => total + kg, 0);

  async function borrar() {
    await repoSesiones.discardSession(sessionId);
    router.replace("/historial");
    avisar({ mensaje: "Entrenamiento eliminado" });
  }

  return (
    <>
      <Cabecera
        titulo={rutina?.name ?? "Sesión libre"}
        subtitulo={formatearFecha(sesion.startedAt)}
        atras="/historial"
      />

      <div className="space-y-3 px-4">
        {!enCurso && (
          <div className="flex items-center gap-3 rounded-lg border border-acento/30 bg-acento/5 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded bg-acento text-tinta">
              <IconoTrofeo width={20} height={20} />
            </span>
            <div className="min-w-0">
              <p className="titulo-sm">Entrenamiento completado</p>
              <p className="etiqueta-caps mt-0.5 text-suave">
                {formatearHora(sesion.startedAt)} · guardado en este dispositivo
              </p>
            </div>
          </div>
        )}

        {/* Telemetría de la sesión */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tarjeta>
            <Rotulo>Duración</Rotulo>
            <p className="metrica mt-1">
              {sesion.finishedAt
                ? formatearDuracion(sesion.startedAt, sesion.finishedAt)
                : "en curso"}
            </p>
            {ritmo !== null && (
              <p className="etiqueta-caps mt-1 text-suave">
                Ritmo: {numeroCorto(ritmo)} min/serie
              </p>
            )}
          </Tarjeta>

          <Tarjeta>
            <Rotulo>Series efectivas</Rotulo>
            <p className="metrica mt-1">{efectivas.length}</p>
            <p className="etiqueta-caps mt-1 text-suave">
              {plural(porEjercicio.size, "ejercicio", "ejercicios")}
            </p>
          </Tarjeta>

          <Tarjeta className="col-span-2">
            <Rotulo>Carga total</Rotulo>
            <p className="metrica mt-1">{formatearVolumen(volumen, unit)}</p>
            <p className="etiqueta-caps mt-1 text-suave">Peso × repeticiones de cada serie</p>
          </Tarjeta>
        </div>

        {/* Récords conseguidos en esta sesión */}
        {recordsDeHoy.map((marca) => (
          <div key={marca.id} className="rounded-lg border border-acento/40 bg-acento/5 p-4">
            <span className="etiqueta-caps inline-flex items-center gap-1.5 rounded bg-acento px-2 py-1 text-tinta">
              <IconoRayo width={12} height={12} />
              Nuevo récord personal
            </span>
            <p className="titulo-md mt-2 truncate">
              {catalogo.get(marca.exerciseId)?.name ?? "Ejercicio"}
            </p>
            <p className="titulo-lg mt-1 text-acento-texto tabular-nums">
              {formatearPeso(marca.weightKg, unit)} × {marca.reps}
            </p>
            <p className="etiqueta-caps mt-2 text-suave">
              1RM estimada: {formatearPeso(marca.estimated1rm, unit)}
            </p>
          </div>
        ))}

        {/* Distribución por grupo */}
        {grupos.length > 0 && volumenTotalGrupos > 0 && (
          <Tarjeta>
            <Rotulo className="mb-3">Distribución por grupo</Rotulo>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full">
              {grupos.map(([grupo, kg]) => (
                <span
                  key={grupo}
                  className="block h-full"
                  style={{
                    width: `${(kg / volumenTotalGrupos) * 100}%`,
                    background: COLOR_GRUPO[grupo],
                  }}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {grupos.map(([grupo, kg]) => (
                <li key={grupo} className="etiqueta-caps flex items-center gap-1.5 text-suave">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: COLOR_GRUPO[grupo] }}
                  />
                  {etiquetaGrupo(grupo)} ({Math.round((kg / volumenTotalGrupos) * 100)}%)
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}

        {/* Detalle serie a serie */}
        <div className="flex items-center justify-between">
          <Rotulo>Detalle de series</Rotulo>
          <span className="etiqueta-caps text-suave">Serie a serie</span>
        </div>

        {[...porEjercicio.entries()].map(([exerciseId, series], indice) => {
          const ejercicio = catalogo.get(exerciseId);
          const tieneRecord = recordsDeHoy.some((m) => m.exerciseId === exerciseId);

          return (
            <Tarjeta key={exerciseId}>
              <div className="mb-3 flex items-center gap-2">
                {ejercicio && (
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: COLOR_GRUPO[ejercicio.muscleGroup] }}
                  />
                )}
                <h2 className="titulo-sm min-w-0 flex-1 truncate">
                  <span className="text-suave">{indice + 1}. </span>
                  {ejercicio?.name ?? "Ejercicio"}
                </h2>
                {tieneRecord && (
                  <span className="etiqueta-caps shrink-0 rounded bg-acento px-2 py-1 text-tinta">
                    PR
                  </span>
                )}
              </div>

              <ul className="grid grid-cols-3 gap-2">
                {series.map((serie) => (
                  <li
                    key={serie.id}
                    className={juntar(
                      "rounded border px-2 py-2 text-center",
                      serie.isWarmup
                        ? "border-borde bg-superficie-2/50 text-suave"
                        : "border-borde bg-superficie-2",
                    )}
                  >
                    <span className="etiqueta-caps block text-suave">
                      {serie.isWarmup ? "C" : "S"}
                      {serie.setNumber}
                      {serie.rpe != null && (
                        <span className="ml-1 text-info">R{numeroCorto(serie.rpe)}</span>
                      )}
                    </span>
                    <span className="etiqueta-md mt-0.5 block tabular-nums">
                      {formatearSerie(serie.weightKg, serie.reps, unit, ejercicio?.tracking)}
                    </span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          );
        })}

        {enCurso && (
          <Boton variante="primario" ancho onClick={() => router.push(`/entrenar/${sessionId}`)}>
            Continuar este entrenamiento
          </Boton>
        )}

        <Boton variante="peligro" ancho onClick={() => void borrar()}>
          <IconoBasura width={18} height={18} />
          Eliminar entrenamiento
        </Boton>
      </div>
    </>
  );
}
