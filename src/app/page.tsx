"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  IconoAdelante,
  IconoLlama,
  IconoMancuerna,
  IconoReproducir,
} from "@/components/iconos";
import {
  Barra,
  Boton,
  Cargando,
  EstadoVacio,
  Etiqueta,
  juntar,
  Pip,
  Rotulo,
  Tarjeta,
} from "@/components/ui";
import { COLOR_GRUPO, etiquetaGrupo, formatearVolumen, plural } from "@/lib/format";
import { useAjustes, useDatos, useEstaEnLinea, useUsuarioActual } from "@/lib/hooks";
import {
  ejercicios as repoEjercicios,
  estadisticas as repoEstadisticas,
  rutinas as repoRutinas,
  sesiones as repoSesiones,
} from "@/lib/repositories";
import { ahora, DIAS_CORTOS, formatearReloj, tiempoRelativo } from "@/lib/time";
import type { MuscleGroup } from "@/lib/types";

/** Pantalla de inicio: qué toca hoy, la semana en curso y la racha. */
export default function PaginaHoy() {
  const userId = useUsuarioActual();
  const router = useRouter();
  const { unit } = useAjustes();
  const enLinea = useEstaEnLinea();

  const datos = useDatos(async () => {
    const activa = await repoSesiones.getActiveSession(userId);
    const lista = await repoRutinas.getRoutinesByUser(userId);
    const siguienteId = await repoSesiones.getNextRoutineIdInRotation(
      userId,
      lista.map((r) => r.id),
    );
    const siguiente = lista.find((r) => r.id === siguienteId) ?? null;

    // Grupos musculares de la rutina que toca: sale de sus ejercicios, no de
    // una etiqueta escrita a mano que se quedaría desactualizada.
    let grupos: MuscleGroup[] = [];
    let numeroEjercicios = 0;
    if (siguiente) {
      const filas = await repoRutinas.getRoutineExercises(siguiente.id);
      numeroEjercicios = filas.length;
      const catalogo = await repoEjercicios.getExercisesByIds(filas.map((f) => f.exerciseId));
      grupos = [
        ...new Set(
          filas
            .map((f) => catalogo.get(f.exerciseId)?.muscleGroup)
            .filter((g): g is MuscleGroup => !!g),
        ),
      ];
    }

    const semana = await repoEstadisticas.getSemana(userId);
    const racha = await repoEstadisticas.getRacha(userId);
    const volumen = await repoEstadisticas.getVolumenSemanal(userId);
    const ultimas = await repoEstadisticas.getResumenesRecientes(userId, 3);

    return {
      activa,
      lista,
      siguiente,
      grupos,
      numeroEjercicios,
      semana,
      racha,
      volumen,
      ultimas,
    };
  }, [userId]);

  if (!datos) return <Cargando />;

  const {
    activa,
    lista,
    siguiente,
    grupos,
    numeroEjercicios,
    semana,
    racha,
    volumen,
    ultimas,
  } = datos;

  const volumenSemana = volumen.reduce((total, v) => total + v.volumenKg, 0);
  const seriesSemana = volumen.reduce((total, v) => total + v.series, 0);
  const ultima = ultimas[0] ?? null;

  return (
    <>
      <header className="sticky top-0 z-30 mb-3 flex items-center gap-2 border-b border-borde bg-fondo/90 px-4 py-3 backdrop-blur-xl">
        <Logo size={26} />
        <h1 className="titulo-sm flex-1 uppercase tracking-tight text-suave">Hoy</h1>
        {/*
          El aviso solo aparece cuando de verdad no hay red. Una píldora fija
          diciendo "sin conexión" no informa de nada: se aprende a ignorarla y
          deja de avisar el día que importa.
        */}
        {!enLinea && <Pip tono="aviso">Sin conexión</Pip>}
      </header>

      <div className="space-y-3 px-4">
        {/* Acción principal */}
        {activa ? (
          <Tarjeta className="serie-activa">
            <Rotulo className="text-acento-texto">Entrenamiento en curso</Rotulo>
            <p className="metrica mt-1">{formatearReloj(activa.startedAt, ahora())}</p>
            <Boton
              variante="primario"
              ancho
              className="mt-3"
              onClick={() => router.push(`/entrenar/${activa.id}`)}
            >
              <IconoReproducir width={18} height={18} />
              Continuar entrenamiento
            </Boton>
          </Tarjeta>
        ) : lista.length === 0 ? (
          <EstadoVacio
            titulo="Empieza por tu primera rutina"
            descripcion="Crea una rutina con los ejercicios que haces y la app se encargará de recordarte pesos y repeticiones."
            accion={
              <Boton variante="primario" onClick={() => router.push("/rutinas")}>
                Crear una rutina
              </Boton>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-borde bg-superficie">
            {/* Filo lima superior: marca cuál es la acción de la pantalla. */}
            <div aria-hidden className="h-1 bg-acento" />
            <div className="p-4">
              <Rotulo className="text-acento-texto">Entrenamiento de hoy</Rotulo>
              <h2 className="titulo-lg mt-1">{siguiente?.name ?? "Sesión libre"}</h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <Etiqueta>{plural(numeroEjercicios, "ejercicio", "ejercicios")}</Etiqueta>
                {grupos.slice(0, 3).map((grupo) => (
                  <Etiqueta key={grupo} color={COLOR_GRUPO[grupo]}>
                    {etiquetaGrupo(grupo)}
                  </Etiqueta>
                ))}
              </div>

              <Boton
                variante="primario"
                ancho
                className="mt-4"
                onClick={() => router.push("/entrenar")}
              >
                <IconoMancuerna width={18} height={18} />
                Empezar entrenamiento
              </Boton>
            </div>
          </div>
        )}

        {/* Semana y racha */}
        <Tarjeta>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Rotulo>Esta semana</Rotulo>
            {racha > 0 && (
              <span className="etiqueta-caps inline-flex items-center gap-1.5 text-acento-texto">
                <IconoLlama width={14} height={14} />
                {plural(racha, "día de racha", "días de racha")}
              </span>
            )}
          </div>

          <ul className="flex justify-between gap-1">
            {semana.map((dia, indice) => {
              const entrenado = dia.sesiones.length > 0;
              return (
                <li key={dia.claveDia} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="etiqueta-caps text-suave">{DIAS_CORTOS[indice]}</span>
                  <span
                    className={juntar(
                      "grid aspect-square w-full max-w-11 place-items-center rounded border text-sm tabular-nums",
                      entrenado
                        ? "border-acento bg-acento font-bold text-tinta"
                        : dia.esHoy
                          ? "border-acento/60 font-semibold text-acento-texto"
                          : dia.esFuturo
                            ? "border-borde text-suave/40"
                            : "border-borde text-suave",
                    )}
                  >
                    {dia.fecha.getDate()}
                  </span>
                </li>
              );
            })}
          </ul>
        </Tarjeta>

        {/* Métricas de la semana */}
        {(seriesSemana > 0 || ultima) && (
          <div className="grid grid-cols-2 gap-3">
            <Tarjeta>
              <Rotulo>Volumen semanal</Rotulo>
              <p className="metrica mt-1">{formatearVolumen(volumenSemana, unit)}</p>
              <p className="etiqueta-caps mt-1 text-suave">
                {plural(seriesSemana, "serie", "series")}
              </p>
            </Tarjeta>

            <Tarjeta>
              <Rotulo>Último entreno</Rotulo>
              <p className="titulo-md mt-1 truncate">
                {ultima?.nombresEjercicios[0] ?? "—"}
              </p>
              <p className="etiqueta-caps mt-1 text-acento-texto">
                {ultima ? tiempoRelativo(ultima.session.startedAt) : "sin datos"}
              </p>
              {ultima && (
                <p className="etiqueta-caps mt-1 text-suave">
                  {plural(ultima.totalSeries, "serie", "series")}
                </p>
              )}
            </Tarjeta>
          </div>
        )}

        {/* Volumen por grupo */}
        {volumen.length > 0 && (
          <Tarjeta>
            <Rotulo className="mb-3">Distribución por grupo</Rotulo>
            <ul className="space-y-2">
              {volumen.slice(0, 5).map((fila) => (
                <li key={fila.grupo} className="flex items-center gap-3">
                  <span className="etiqueta-md w-20 shrink-0">{etiquetaGrupo(fila.grupo)}</span>
                  <Barra
                    className="flex-1"
                    color={COLOR_GRUPO[fila.grupo]}
                    porcentaje={(fila.volumenKg / volumen[0].volumenKg) * 100}
                  />
                  <span className="etiqueta-caps w-16 shrink-0 text-right text-suave">
                    {plural(fila.series, "serie", "series")}
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}

        {/* Últimos entrenamientos */}
        {ultimas.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <Rotulo>Últimos entrenamientos</Rotulo>
              <Link href="/historial" className="etiqueta-caps text-acento-texto">
                Ver todo
              </Link>
            </div>

            <ul className="space-y-2">
              {ultimas.map((resumen) => (
                <li key={resumen.session.id}>
                  <Link
                    href={`/historial/${resumen.session.id}`}
                    className="flex items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 active:bg-superficie-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {resumen.nombresEjercicios.slice(0, 3).join(", ") || "Sin ejercicios"}
                      </span>
                      <span className="etiqueta-caps mt-1 block text-suave">
                        {tiempoRelativo(resumen.session.startedAt)} ·{" "}
                        {plural(resumen.totalSeries, "serie", "series")}
                      </span>
                    </span>
                    <IconoAdelante className="shrink-0 text-suave" width={18} height={18} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
