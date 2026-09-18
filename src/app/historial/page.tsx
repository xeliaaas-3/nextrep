"use client";

import Link from "next/link";
import { IconoAdelante } from "@/components/iconos";
import { Cabecera, Cargando, EstadoVacio, BotonEnlace } from "@/components/ui";
import { formatearVolumen, plural } from "@/lib/format";
import { useAjustes, useDatos, useUsuarioActual } from "@/lib/hooks";
import { estadisticas as repoEstadisticas } from "@/lib/repositories";
import { formatearDuracion, formatearFecha, formatearHora } from "@/lib/time";

/** Todas las sesiones terminadas, de la más reciente a la más antigua. */
export default function PaginaHistorial() {
  const userId = useUsuarioActual();
  const { unit } = useAjustes();

  const resumenes = useDatos(
    () => repoEstadisticas.getResumenesRecientes(userId, 100),
    [userId],
  );

  if (!resumenes) return <Cargando />;

  return (
    <>
      <Cabecera titulo="Historial" subtitulo={plural(resumenes.length, "entrenamiento", "entrenamientos")} />

      {resumenes.length === 0 ? (
        <EstadoVacio
          titulo="Aún no has terminado ningún entrenamiento"
          descripcion="Cuando completes una sesión aparecerá aquí, con sus series y su volumen."
          accion={
            <BotonEnlace href="/entrenar" variante="primario">
              Empezar a entrenar
            </BotonEnlace>
          }
        />
      ) : (
        <ul className="space-y-2 px-4">
          {resumenes.map((resumen) => (
            <li key={resumen.session.id}>
              <Link
                href={`/historial/${resumen.session.id}`}
                className="flex items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 active:bg-superficie-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium first-letter:uppercase">
                    {formatearFecha(resumen.session.startedAt)}
                  </span>
                  <span className="block truncate text-sm text-suave">
                    {resumen.nombresEjercicios.join(", ") || "Sin ejercicios"}
                  </span>
                  <span className="mt-0.5 block text-xs tabular-nums text-suave">
                    {formatearHora(resumen.session.startedAt)} ·{" "}
                    {resumen.session.finishedAt
                      ? formatearDuracion(resumen.session.startedAt, resumen.session.finishedAt)
                      : "en curso"}{" "}
                    · {resumen.totalSeries} series · {formatearVolumen(resumen.volumenKg, unit)}
                  </span>
                </span>
                <IconoAdelante className="shrink-0 text-suave" width={18} height={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
