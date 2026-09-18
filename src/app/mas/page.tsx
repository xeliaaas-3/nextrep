"use client";

import Link from "next/link";
import { useState } from "react";
import { useAvisos } from "@/components/Avisos";
import {
  IconoAdelante,
  IconoAjustes,
  IconoHistorial,
  IconoMancuerna,
  IconoVideo,
} from "@/components/iconos";
import { Boton, Cabecera, Cargando, Rotulo, Tarjeta } from "@/components/ui";
import { formatearVolumen, plural } from "@/lib/format";
import { useAjustes, useDatos, useUsuarioActual } from "@/lib/hooks";
import { estadisticas as repoEstadisticas, media as repoMedia } from "@/lib/repositories";
import { sembrarReferencias } from "@/lib/seed";

/** Todo lo que no cabe en las cuatro pestañas principales. */
export default function PaginaMas() {
  const userId = useUsuarioActual();
  const { unit } = useAjustes();
  const { avisar } = useAvisos();
  const [cargando, setCargando] = useState(false);

  async function cargarReferencias() {
    setCargando(true);
    try {
      const creadas = await sembrarReferencias(userId);
      avisar({
        mensaje:
          creadas === 0
            ? "Todos los ejercicios del catálogo ya tienen referencia"
            : `${plural(creadas, "vídeo añadido", "vídeos añadidos")} al catálogo`,
        tono: creadas === 0 ? "neutro" : "exito",
      });
    } finally {
      setCargando(false);
    }
  }

  const datos = useDatos(async () => {
    const sesiones = await repoEstadisticas.getResumenesRecientes(userId, 400);
    const almacenamiento = await repoMedia.getUsoDeAlmacenamiento(userId);
    const volumenTotal = sesiones.reduce((total, s) => total + s.volumenKg, 0);
    const seriesTotales = sesiones.reduce((total, s) => total + s.totalSeries, 0);

    return { sesiones: sesiones.length, seriesTotales, volumenTotal, almacenamiento };
  }, [userId]);

  if (!datos) return <Cargando />;

  const { sesiones, seriesTotales, volumenTotal, almacenamiento } = datos;

  return (
    <>
      <Cabecera titulo="Más" />

      <div className="space-y-3 px-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
        <Tarjeta>
          <Rotulo>Desde que empezaste</Rotulo>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <dd className="metrica">{sesiones}</dd>
              <dt className="etiqueta-caps mt-1 text-suave">Sesiones</dt>
            </div>
            <div>
              <dd className="metrica">{seriesTotales}</dd>
              <dt className="etiqueta-caps mt-1 text-suave">Series</dt>
            </div>
            <div>
              <dd className="metrica">{formatearVolumen(volumenTotal, unit)}</dd>
              <dt className="etiqueta-caps mt-1 text-suave">Volumen</dt>
            </div>
          </dl>
        </Tarjeta>

        <Enlace
          href="/historial"
          Icono={IconoHistorial}
          titulo="Historial"
          detalle={plural(sesiones, "entrenamiento guardado", "entrenamientos guardados")}
        />

        <Enlace
          href="/ejercicios"
          Icono={IconoMancuerna}
          titulo="Biblioteca de ejercicios"
          detalle="Consulta el catálogo o crea los tuyos"
        />

        <Enlace
          href="/ajustes"
          Icono={IconoAjustes}
          titulo="Ajustes"
          detalle="Unidad, descanso, tema y avisos"
        />

        <Tarjeta>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded bg-superficie-2 text-suave">
              <IconoVideo width={18} height={18} />
            </span>
            <div className="min-w-0">
              <Rotulo>Referencias de técnica</Rotulo>
              <p className="mt-1 text-sm text-suave">
                {almacenamiento.elementos === 0
                  ? "Todavía no hay ninguna referencia guardada."
                  : `${plural(almacenamiento.elementos, "referencia", "referencias")} · ${repoMedia.formatearTamano(almacenamiento.bytes)} de archivos en este dispositivo.`}
              </p>
              <p className="mt-2 text-sm text-suave">
                El catálogo trae un vídeo de YouTube por ejercicio. Necesitan conexión: para
                verlos en el gimnasio, graba el tuyo desde la ficha del ejercicio.
              </p>
              <Boton
                ancho
                className="mt-3"
                disabled={cargando}
                onClick={() => void cargarReferencias()}
              >
                {cargando ? "Cargando..." : "Cargar los vídeos que falten"}
              </Boton>
            </div>
          </div>
        </Tarjeta>
      </div>
    </>
  );
}

function Enlace({
  href,
  Icono,
  titulo,
  detalle,
}: {
  href: string;
  Icono: (p: { width?: number; height?: number }) => React.ReactElement;
  titulo: string;
  detalle: string;
}) {
  return (
    <Link
      href={href}
      className="tactil flex items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 active:bg-superficie-2"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded bg-superficie-2 text-suave">
        <Icono width={18} height={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="titulo-sm block truncate">{titulo}</span>
        <span className="block truncate text-sm text-suave">{detalle}</span>
      </span>
      <IconoAdelante className="shrink-0 text-suave" width={18} height={18} />
    </Link>
  );
}
