"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconoTrofeo } from "@/components/iconos";
import { Boton, Cabecera, Cargando, EstadoVacio, Tarjeta, BotonEnlace } from "@/components/ui";
import {
  COLOR_GRUPO,
  desdeKg,
  etiquetaGrupo,
  formatearPeso,
  formatearVolumen,
  numeroCorto,
  plural,
} from "@/lib/format";
import { useAjustes, useDatos, useUsuarioActual } from "@/lib/hooks";
import {
  ejercicios as repoEjercicios,
  estadisticas as repoEstadisticas,
  records as repoRecords,
  series as repoSeries,
} from "@/lib/repositories";
import { claveDia, tiempoRelativo } from "@/lib/time";
import type { UUID } from "@/lib/types";

/** Progreso: evolución por ejercicio, volumen semanal y récords. */
export default function PaginaProgreso() {
  const userId = useUsuarioActual();
  const { unit } = useAjustes();
  const [seleccionado, setSeleccionado] = useState<UUID | null>(null);

  const base = useDatos(async () => {
    const ids = await repoSeries.getTrainedExerciseIds(userId);
    const catalogo = await repoEjercicios.getExercisesByIds(ids);
    const entrenados = ids
      .map((id) => catalogo.get(id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const marcas = await repoRecords.getPersonalRecords(userId);
    const volumen = await repoEstadisticas.getVolumenSemanal(userId);

    return { entrenados, catalogo, marcas, volumen };
  }, [userId]);

  const activo = seleccionado ?? base?.entrenados[0]?.id ?? null;

  const grafica = useDatos(async () => {
    if (!activo) return null;
    const historial = await repoSeries.getExerciseHistory(userId, activo);

    // Un punto por día entrenado: la mejor serie de ese día.
    const porDia = new Map<string, { fecha: string; mejorKg: number; volumen: number }>();
    for (const serie of historial) {
      const dia = claveDia(serie.completedAt);
      const actual = porDia.get(dia) ?? { fecha: dia, mejorKg: 0, volumen: 0 };
      actual.mejorKg = Math.max(actual.mejorKg, serie.weightKg);
      actual.volumen += serie.weightKg * serie.reps;
      porDia.set(dia, actual);
    }

    return [...porDia.values()].map((punto) => ({
      fecha: punto.fecha.slice(5).replace("-", "/"),
      peso: desdeKg(punto.mejorKg, unit),
      volumen: Math.round(desdeKg(punto.volumen, unit)),
    }));
  }, [activo, userId, unit]);

  if (!base) return <Cargando />;

  const { entrenados, catalogo, marcas, volumen } = base;

  if (entrenados.length === 0) {
    return (
      <>
        <Cabecera titulo="Progreso" />
        <EstadoVacio
          titulo="Todavía no hay nada que medir"
          descripcion="En cuanto registres tus primeras series aparecerán aquí tu evolución por ejercicio y tus récords."
          accion={
            <BotonEnlace href="/entrenar" variante="primario">
              Empezar a entrenar
            </BotonEnlace>
          }
        />
      </>
    );
  }

  const volumenTotal = volumen.reduce((total, v) => total + v.volumenKg, 0);

  return (
    <>
      <Cabecera titulo="Progreso" />

      <div className="space-y-4 px-4">
        <Tarjeta>
          <h2 className="mb-3 text-sm font-medium text-suave">Evolución por ejercicio</h2>

          <div className="sin-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {entrenados.map((ejercicio) => (
              <Boton
                key={ejercicio.id}
                variante={ejercicio.id === activo ? "primario" : "secundario"}
                className="shrink-0 !min-h-10 text-sm"
                onClick={() => setSeleccionado(ejercicio.id)}
              >
                {ejercicio.name}
              </Boton>
            ))}
          </div>

          {grafica && grafica.length > 1 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grafica} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--borde)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: "var(--texto-suave)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--borde)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--texto-suave)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--superficie-2)",
                      border: "1px solid var(--borde)",
                      borderRadius: 12,
                      color: "var(--texto)",
                    }}
                    labelStyle={{ color: "var(--texto-suave)" }}
                    formatter={(valor) => [`${numeroCorto(Number(valor))} ${unit}`, "Mejor serie"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="var(--acento)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--acento)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-suave">
              Necesitas al menos dos días con este ejercicio para ver la evolución.
            </p>
          )}
        </Tarjeta>

        {volumen.length > 0 && (
          <Tarjeta>
            <h2 className="mb-1 text-sm font-medium text-suave">Volumen de esta semana</h2>
            <p className="mb-3 text-lg font-semibold tabular-nums">
              {formatearVolumen(volumenTotal, unit)}
            </p>

            <ul className="space-y-2">
              {volumen.map((fila) => (
                <li key={fila.grupo} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm">{etiquetaGrupo(fila.grupo)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-superficie-2">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(fila.volumenKg / volumen[0].volumenKg) * 100}%`,
                        background: COLOR_GRUPO[fila.grupo],
                      }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-suave">
                    {plural(fila.series, "serie", "series")}
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}

        <Tarjeta>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-suave">
            <IconoTrofeo width={16} height={16} />
            Récords personales
          </h2>

          {marcas.size === 0 ? (
            <p className="text-sm text-suave">Aún no hay récords registrados.</p>
          ) : (
            <ul className="space-y-1">
              {[...marcas.values()]
                .sort((a, b) => b.estimated1rm - a.estimated1rm)
                .map((marca) => (
                  <li
                    key={marca.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm odd:bg-superficie-2"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {catalogo.get(marca.exerciseId)?.name ?? "Ejercicio"}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatearPeso(marca.weightKg, unit)} × {marca.reps}
                    </span>
                    <span className="w-20 shrink-0 text-right text-xs text-suave">
                      {tiempoRelativo(marca.achievedAt)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
