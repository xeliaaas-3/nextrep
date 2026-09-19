"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mantenerPantallaEncendida, prepararAudio } from "@/lib/alerta";
import {
  etiquetaEquipo,
  etiquetaGrupo,
  formatearPeso,
  resumenSeries,
} from "@/lib/format";
import {
  useAjustes,
  useDatos,
  useEstadoPersistente,
  useTicker,
  useUsuarioActual,
} from "@/lib/hooks";
import { sugerirCalentamiento, sugerirObjetivo, type PasoCalentamiento } from "@/lib/progression";
import {
  ejercicios as repoEjercicios,
  media as repoMedia,
  records as repoRecords,
  rutinas as repoRutinas,
  series as repoSeries,
  sesiones as repoSesiones,
} from "@/lib/repositories";
import { formatearReloj, tiempoRelativo } from "@/lib/time";
import type { Exercise, RoutineExercise, SetLog, UUID } from "@/lib/types";
import { useAvisos } from "../Avisos";
import { HojaMedia } from "../media/HojaMedia";
import { IndicadorEnlace, MiniaturaMedia } from "../media/VisorMedia";
import {
  IconoAdelante,
  IconoAtras,
  IconoBajar,
  IconoMas,
  IconoRayo,
  IconoReproducir,
  IconoVideo,
} from "../iconos";
import { SelectorEjercicio } from "../SelectorEjercicio";
import { Barra, Boton, Cargando, juntar, Rotulo } from "../ui";
import { Calentamiento } from "./Calentamiento";
import { TablaSeries } from "./TablaSeries";
import { TemporizadorDescanso } from "./TemporizadorDescanso";
import type { ValoresSerie } from "./EditorDeSerie";

/** Valores por defecto cuando el ejercicio no viene de una rutina. */
const PLAN_LIBRE = { targetSets: 3, repRangeMin: 8, repRangeMax: 12 };

/** Pasado este margen, un descanso terminado se considera de otra sesión. */
const CADUCIDAD_DESCANSO_MS = 5 * 60 * 1000;

interface Descanso {
  iniciadoEn: number;
  finEn: number;
}

export function VistaEntrenamiento({ sessionId }: { sessionId: UUID }) {
  const userId = useUsuarioActual();
  const router = useRouter();
  const { avisar } = useAvisos();
  const { unit, defaultRestSeconds } = useAjustes();

  const [indiceActivo, setIndiceActivo] = useState(0);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [mediaAbierta, setMediaAbierta] = useState(false);
  const [editando, setEditando] = useState<UUID | null>(null);
  const [seriesExtra, setSeriesExtra] = useState<Record<UUID, number>>({});
  const [descansoGuardado, setDescansoGuardado] = useEstadoPersistente<Descanso | null>(
    `gym:descanso:${sessionId}`,
    null,
  );
  const [extras, setExtras] = useEstadoPersistente<UUID[]>(`gym:extras:${sessionId}`, []);

  const tick = useTicker(true, 1000);

  const refPestanaActiva = useCallback((nodo: HTMLButtonElement | null) => {
    nodo?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, []);

  const datos = useDatos(async () => {
    const sesion = await repoSesiones.getSessionById(sessionId, userId);
    if (!sesion) return null;

    const rutina = sesion.routineId
      ? await repoRutinas.getRoutineById(sesion.routineId, userId)
      : null;
    const planificados = sesion.routineId
      ? await repoRutinas.getRoutineExercises(sesion.routineId)
      : [];
    const seriesPorEjercicio = await repoSeries.getSetLogsBySessionGrouped(sessionId);

    const ids = [
      ...new Set([
        ...planificados.map((p) => p.exerciseId),
        ...seriesPorEjercicio.keys(),
        ...extras,
      ]),
    ];
    const catalogo = await repoEjercicios.getExercisesByIds(ids);
    const referencias = await repoMedia.getMediaMapForUser(userId);

    return { sesion, rutina, planificados, seriesPorEjercicio, catalogo, referencias, ids };
  }, [sessionId, userId, extras]);

  // Lista ordenada de ejercicios de la sesión: primero los de la rutina, en su
  // orden, y después los que se hayan añadido sobre la marcha.
  const ejerciciosSesion = useMemo(() => {
    if (!datos) return [];

    const planPorEjercicio = new Map<UUID, RoutineExercise>();
    for (const plan of datos.planificados) planPorEjercicio.set(plan.exerciseId, plan);

    const ordenados: { ejercicio: Exercise; plan: RoutineExercise | null }[] = [];

    for (const plan of datos.planificados) {
      const ejercicio = datos.catalogo.get(plan.exerciseId);
      if (ejercicio) ordenados.push({ ejercicio, plan });
    }

    for (const id of datos.ids) {
      if (planPorEjercicio.has(id)) continue;
      const ejercicio = datos.catalogo.get(id);
      if (ejercicio) ordenados.push({ ejercicio, plan: null });
    }

    return ordenados;
  }, [datos]);

  const activo = ejerciciosSesion[Math.min(indiceActivo, ejerciciosSesion.length - 1)] ?? null;

  const contexto = useDatos(async () => {
    if (!activo) return null;

    const historial = await repoSeries.getRecentPerformances(
      userId,
      activo.ejercicio.id,
      3,
      sessionId,
    );

    const sugerencia = sugerirObjetivo({
      grupo: activo.ejercicio.muscleGroup,
      repRangeMin: activo.plan?.repRangeMin ?? PLAN_LIBRE.repRangeMin,
      repRangeMax: activo.plan?.repRangeMax ?? PLAN_LIBRE.repRangeMax,
      historial,
    });

    return { historial, sugerencia, ultima: historial[0] ?? null };
  }, [activo?.ejercicio.id, userId, sessionId]);

  useEffect(() => {
    let bloqueo: WakeLockSentinel | null = null;
    void mantenerPantallaEncendida().then((resultado) => {
      bloqueo = resultado;
    });
    return () => {
      void bloqueo?.release().catch(() => undefined);
    };
  }, []);

  const descanso =
    descansoGuardado && descansoGuardado.finEn > tick - CADUCIDAD_DESCANSO_MS
      ? descansoGuardado
      : null;

  if (datos === undefined) return <Cargando />;

  if (datos === null) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="titulo-sm">Esta sesión ya no existe</p>
        <Boton className="mt-4" onClick={() => router.replace("/entrenar")}>
          Volver
        </Boton>
      </div>
    );
  }

  const { sesion, rutina, seriesPorEjercicio, referencias } = datos;
  const todasLasSeries = [...seriesPorEjercicio.values()].flat();
  const totalCompletadas = todasLasSeries.filter((s) => !s.isWarmup).length;

  const ejerciciosHechos = ejerciciosSesion.filter(({ ejercicio, plan }) => {
    const hechas = (seriesPorEjercicio.get(ejercicio.id) ?? []).length;
    return hechas >= (plan?.targetSets ?? PLAN_LIBRE.targetSets);
  }).length;

  function iniciarDescanso(segundos: number) {
    if (segundos <= 0) return;
    const inicio = Date.now();
    setDescansoGuardado({ iniciadoEn: inicio, finEn: inicio + segundos * 1000 });
  }

  async function confirmarSerie(valores: ValoresSerie) {
    if (!activo) return;

    // El toque que confirma la serie es el gesto que nos deja usar audio luego.
    prepararAudio();

    // Solo cuentan las del mismo tipo: si no, la serie 1 efectiva saldría
    // numerada como la 5 por haber calentado cuatro veces.
    const yaHechas = (seriesPorEjercicio.get(activo.ejercicio.id) ?? []).filter(
      (s) => s.isWarmup === valores.esCalentamiento,
    );
    const serie = await repoSeries.logSet(userId, {
      sessionId,
      exerciseId: activo.ejercicio.id,
      setNumber: yaHechas.length + 1,
      weightKg: valores.pesoKg,
      reps: valores.reps,
      rpe: valores.rpe,
      isWarmup: valores.esCalentamiento,
    });

    const esRecord = await repoRecords.upsertRecordIfBetter(userId, serie);
    if (esRecord) {
      avisar({ mensaje: `¡Récord en ${activo.ejercicio.name}!`, tono: "exito" });
    }

    // El calentamiento no descansa: se encadena con la siguiente aproximación.
    if (!valores.esCalentamiento) {
      iniciarDescanso(activo.plan?.restSeconds ?? defaultRestSeconds);
    }
  }

  async function registrarCalentamiento(paso: PasoCalentamiento) {
    if (!activo) return;
    prepararAudio();

    const yaHechas = (seriesPorEjercicio.get(activo.ejercicio.id) ?? []).filter(
      (s) => s.isWarmup,
    );
    await repoSeries.logSet(userId, {
      sessionId,
      exerciseId: activo.ejercicio.id,
      setNumber: yaHechas.length + 1,
      weightKg: paso.pesoKg,
      reps: paso.reps,
      rpe: null,
      isWarmup: true,
    });

    // El calentamiento no descansa: se encadena con el siguiente escalón.
  }

  async function deshacerCalentamiento(serie: SetLog) {
    await repoSeries.deleteSetLog(serie.id);
  }

  async function guardarEdicion(id: UUID, valores: ValoresSerie) {
    await repoSeries.updateSetLog(id, {
      weightKg: valores.pesoKg,
      reps: valores.reps,
      rpe: valores.rpe,
      isWarmup: valores.esCalentamiento,
    });
    await repoRecords.rebuildPersonalRecords(userId);
    setEditando(null);

    const serie = todasLasSeries.find((s) => s.id === id);
    avisar({
      mensaje: "Serie corregida",
      accion: serie
        ? {
            etiqueta: "Deshacer",
            alPulsar: () => {
              void repoSeries
                .updateSetLog(id, {
                  weightKg: serie.weightKg,
                  reps: serie.reps,
                  rpe: serie.rpe,
                  isWarmup: serie.isWarmup,
                })
                .then(() => repoRecords.rebuildPersonalRecords(userId));
            },
          }
        : undefined,
    });
  }

  async function terminar() {
    if (totalCompletadas === 0) {
      await repoSesiones.discardSession(sessionId);
      avisar({ mensaje: "Sesión descartada: no registraste ninguna serie" });
      router.replace("/entrenar");
      return;
    }

    await repoSesiones.finishSession(sessionId);
    router.replace(`/historial/${sessionId}`);
    avisar({
      mensaje: "Entrenamiento guardado",
      tono: "exito",
      accion: {
        etiqueta: "Reabrir",
        alPulsar: () => {
          void repoSesiones.reopenSession(sessionId).then(() => {
            router.replace(`/entrenar/${sessionId}`);
          });
        },
      },
    });
  }

  const todasDelEjercicio = activo ? (seriesPorEjercicio.get(activo.ejercicio.id) ?? []) : [];
  const calentamientosHechos = todasDelEjercicio.filter((s) => s.isWarmup);
  const seriesActivas = todasDelEjercicio.filter((s) => !s.isWarmup);
  const objetivoSeries = activo?.plan?.targetSets ?? PLAN_LIBRE.targetSets;
  const extraDelEjercicio = activo ? (seriesExtra[activo.ejercicio.id] ?? 0) : 0;
  const filasAMostrar = Math.max(objetivoSeries, seriesActivas.length + 1) + extraDelEjercicio;

  const sugerencia = contexto?.sugerencia;

  // La rampa apunta al peso de trabajo de hoy, y solo mientras no hayas
  // empezado a hacer series efectivas: después ya no tiene sentido calentar.
  const pasosCalentamiento =
    activo && seriesActivas.length === 0
      ? sugerirCalentamiento({
          pesoObjetivoKg: sugerencia?.weightKg ?? 0,
          equipo: activo.ejercicio.equipment,
        }).filter(
          (paso) => !calentamientosHechos.some((s) => Math.abs(s.weightKg - paso.pesoKg) < 0.01),
        )
      : [];
  const referenciaActiva = activo ? referencias.get(activo.ejercicio.id) : undefined;

  // Lo que se precarga: dentro de una misma sesión manda la última serie hecha
  // de este ejercicio, porque nadie cambia de peso entre la serie 1 y la 2.
  const ultimaDeLaSesion = seriesActivas.filter((s) => !s.isWarmup).at(-1) ?? null;
  const serieEnEdicion = editando ? todasLasSeries.find((s) => s.id === editando) : undefined;

  const valoresIniciales: ValoresSerie = serieEnEdicion
    ? {
        pesoKg: serieEnEdicion.weightKg,
        reps: serieEnEdicion.reps,
        rpe: serieEnEdicion.rpe,
        esCalentamiento: serieEnEdicion.isWarmup,
      }
    : {
        pesoKg: ultimaDeLaSesion?.weightKg ?? sugerencia?.weightKg ?? 0,
        reps:
          ultimaDeLaSesion?.reps ??
          sugerencia?.reps ??
          activo?.plan?.repRangeMin ??
          PLAN_LIBRE.repRangeMin,
        rpe: null,
        esCalentamiento: false,
      };

  const barraDescanso = descanso ? (
    <TemporizadorDescanso
      iniciadoEn={descanso.iniciadoEn}
      finEn={descanso.finEn}
      alCancelar={() => setDescansoGuardado(null)}
      alSumar={(segundos) =>
        setDescansoGuardado({ ...descanso, finEn: descanso.finEn + segundos * 1000 })
      }
    />
  ) : (
    <p className="etiqueta-caps px-1 text-suave">
      Descanso automático al completar: {activo?.plan?.restSeconds ?? defaultRestSeconds}s
    </p>
  );

  return (
    <div className="pb-64">
      {/* Telemetría de la sesión */}
      <header className="sticky top-0 z-30 border-b border-borde bg-fondo/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Salir sin terminar"
            onClick={() => router.push("/")}
            className="tactil -ml-2 grid place-items-center rounded-lg text-suave active:bg-superficie-2"
          >
            <IconoAtras />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span aria-hidden className="size-2 shrink-0 animar-pulso rounded-full bg-acento" />
              <h1 className="titulo-sm truncate uppercase tracking-tight">
                {rutina?.name ?? "Sesión libre"}
              </h1>
            </div>
            <p className="etiqueta-caps mt-0.5 text-suave">
              T: {formatearReloj(sesion.startedAt, new Date(tick).toISOString())}
              {ejerciciosSesion.length > 0 && (
                <>
                  {" · "}
                  <span className="text-acento-texto">
                    {ejerciciosHechos} de {ejerciciosSesion.length} ejercicios
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void terminar()}
            className="tactil etiqueta-md rounded-lg px-3 font-semibold text-peligro active:bg-peligro/10"
          >
            Fin
          </button>
        </div>

        {ejerciciosSesion.length > 0 && (
          <Barra
            className="mt-3"
            porcentaje={(ejerciciosHechos / ejerciciosSesion.length) * 100}
          />
        )}
      </header>

      {/* Pestañas de ejercicio */}
      {ejerciciosSesion.length > 0 && (
        <div className="sin-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          {ejerciciosSesion.map(({ ejercicio, plan }, indice) => {
            const hechas = (seriesPorEjercicio.get(ejercicio.id) ?? []).length;
            const objetivo = plan?.targetSets ?? PLAN_LIBRE.targetSets;
            const completo = hechas >= objetivo;

            return (
              <button
                key={ejercicio.id}
                type="button"
                ref={indice === indiceActivo ? refPestanaActiva : undefined}
                onClick={() => {
                  setIndiceActivo(indice);
                  setEditando(null);
                }}
                className={juntar(
                  "etiqueta-md shrink-0 rounded border px-3 py-2 transition",
                  indice === indiceActivo
                    ? "border-acento bg-acento font-semibold text-tinta"
                    : completo
                      ? "border-exito/40 bg-exito/10 text-exito"
                      : "border-borde bg-superficie text-suave",
                )}
              >
                {ejercicio.name}
                <span className="ml-1.5 tabular-nums opacity-70">
                  {hechas}/{objetivo}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectorAbierto(true)}
            aria-label="Añadir ejercicio a la sesión"
            className="tactil grid shrink-0 place-items-center rounded border border-dashed border-borde-fuerte px-3 text-suave"
          >
            <IconoMas width={18} height={18} />
          </button>
        </div>
      )}

      {!activo ? (
        <div className="px-4 py-16 text-center">
          <p className="titulo-sm">Esta sesión no tiene ejercicios</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-suave">
            Añade el primero para empezar a registrar series.
          </p>
          <Boton variante="primario" className="mt-5" onClick={() => setSelectorAbierto(true)}>
            <IconoMas width={18} height={18} />
            Añadir ejercicio
          </Boton>
        </div>
      ) : (
        <>
          {/*
            En escritorio, ficha a la izquierda y series a la derecha: la tabla
            estirada a todo lo ancho se lee peor, y así se ve el ejercicio y lo
            que llevas hecho sin desplazarse.
          */}
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-4 lg:px-4">
          {/* Cabecera del ejercicio */}
          <section className="mx-4 mb-3 rounded-lg border border-borde bg-superficie p-4 lg:mx-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Rotulo className="text-info">
                  {etiquetaGrupo(activo.ejercicio.muscleGroup)} ·{" "}
                  {etiquetaEquipo(activo.ejercicio.equipment)}
                </Rotulo>
                <h2 className="titulo-lg mt-1 truncate">{activo.ejercicio.name}</h2>
              </div>

              {/* Referencia de técnica: la miniatura ya adelanta que la hay. */}
              <button
                type="button"
                onClick={() => setMediaAbierta(true)}
                aria-label={
                  referenciaActiva
                    ? "Ver la referencia de técnica"
                    : "Añadir una referencia de técnica"
                }
                className="tactil relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-borde bg-superficie-2 text-suave active:bg-superficie-3"
              >
                {!referenciaActiva ? (
                  <IconoVideo width={20} height={20} />
                ) : referenciaActiva.kind === "enlace" ? (
                  <IndicadorEnlace />
                ) : (
                  <>
                    <MiniaturaMedia media={referenciaActiva} className="absolute inset-0" />
                    <span className="relative grid size-full place-items-center bg-black/35 text-white">
                      <IconoReproducir width={20} height={20} />
                    </span>
                  </>
                )}
              </button>
            </div>

            {contexto?.ultima ? (
              <p className="mt-3 rounded border border-borde bg-superficie-2 px-3 py-2 text-sm text-suave">
                Última vez:{" "}
                <span className="font-semibold text-texto">
                  {resumenSeries(contexto.ultima.series, unit)}
                </span>{" "}
                · {tiempoRelativo(contexto.ultima.fecha)}
              </p>
            ) : (
              <p className="mt-3 rounded border border-borde bg-superficie-2 px-3 py-2 text-sm text-suave">
                Primera vez que registras este ejercicio
              </p>
            )}

            {sugerencia && sugerencia.motivo !== "primera-vez" && (
              <div className="mt-3 flex items-start gap-3 rounded-lg bg-info/10 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded bg-info text-white">
                  {sugerencia.motivo === "subir" ? (
                    <IconoRayo width={18} height={18} />
                  ) : sugerencia.motivo === "bajar" ? (
                    <IconoBajar width={18} height={18} />
                  ) : (
                    <IconoAdelante width={18} height={18} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="etiqueta-caps rounded bg-info px-1.5 py-0.5 text-white">
                      {sugerencia.motivo === "subir"
                        ? "Sobrecarga"
                        : sugerencia.motivo === "bajar"
                          ? "Descarga"
                          : "Mantener"}
                    </span>
                    <span className="titulo-sm tabular-nums">
                      {formatearPeso(sugerencia.weightKg, unit)} × {sugerencia.reps}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-suave">{sugerencia.explicacion}</p>
                </div>
              </div>
            )}

            <p className="etiqueta-caps mt-3 text-suave">
              Objetivo: {objetivoSeries} series ×{" "}
              {activo.plan
                ? `${activo.plan.repRangeMin}-${activo.plan.repRangeMax}`
                : `${PLAN_LIBRE.repRangeMin}-${PLAN_LIBRE.repRangeMax}`}{" "}
              reps
            </p>
          </section>

          <div>
          <Calentamiento
            pasos={pasosCalentamiento}
            hechas={calentamientosHechos}
            unidad={unit}
            alRegistrar={(paso) => void registrarCalentamiento(paso)}
            alDeshacer={(serie) => void deshacerCalentamiento(serie)}
          />

          <TablaSeries
            seriesHechas={seriesActivas}
            filasTotales={filasAMostrar}
            unidad={unit}
            numeroActivo={seriesActivas.length + 1}
            editando={editando}
            valoresIniciales={valoresIniciales}
            barraSuperior={barraDescanso}
            alConfirmar={(valores) => void confirmarSerie(valores)}
            alGuardarEdicion={(id, valores) => void guardarEdicion(id, valores)}
            alAbrirEdicion={setEditando}
            alCerrarEdicion={() => setEditando(null)}
            alAnadirFila={() =>
              setSeriesExtra((actual) => ({
                ...actual,
                [activo.ejercicio.id]: (actual[activo.ejercicio.id] ?? 0) + 1,
              }))
            }
          />

          {/* Salto entre ejercicios */}
          <nav className="mt-3 grid grid-cols-2 gap-2 px-4 lg:px-0">
            <button
              type="button"
              disabled={indiceActivo === 0}
              onClick={() => {
                setIndiceActivo(indiceActivo - 1);
                setEditando(null);
              }}
              className="tactil flex items-center gap-2 rounded-lg border border-borde bg-superficie px-3 text-left active:bg-superficie-2 disabled:pointer-events-none disabled:opacity-30"
            >
              <IconoAtras width={18} height={18} className="shrink-0 text-suave" />
              <span className="min-w-0">
                <span className="etiqueta-caps block text-suave">Anterior</span>
                <span className="block truncate text-sm">
                  {ejerciciosSesion[indiceActivo - 1]?.ejercicio.name ?? "—"}
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={indiceActivo >= ejerciciosSesion.length - 1}
              onClick={() => {
                setIndiceActivo(indiceActivo + 1);
                setEditando(null);
              }}
              className="tactil flex items-center gap-2 rounded-lg border border-borde bg-superficie px-3 text-right active:bg-superficie-2 disabled:pointer-events-none disabled:opacity-30"
            >
              <span className="min-w-0 flex-1">
                <span className="etiqueta-caps block text-suave">Siguiente</span>
                <span className="block truncate text-sm">
                  {ejerciciosSesion[indiceActivo + 1]?.ejercicio.name ?? "—"}
                </span>
              </span>
              <IconoAdelante width={18} height={18} className="shrink-0 text-suave" />
            </button>
          </nav>
          </div>
          </div>
        </>
      )}

      {mediaAbierta && activo && (
        <HojaMedia ejercicio={activo.ejercicio} alCerrar={() => setMediaAbierta(false)} />
      )}

      {selectorAbierto && (
        <SelectorEjercicio
          excluir={ejerciciosSesion.map((e) => e.ejercicio.id)}
          alCerrar={() => setSelectorAbierto(false)}
          alElegir={(ejercicio) => {
            setExtras([...extras, ejercicio.id]);
            setSelectorAbierto(false);
            setIndiceActivo(ejerciciosSesion.length);
          }}
        />
      )}
    </div>
  );
}
