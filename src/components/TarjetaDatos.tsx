"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  consultarAlmacenamiento,
  formatearBytes,
  pedirAlmacenamientoPersistente,
  type EstadoAlmacenamiento,
} from "@/lib/almacenamiento";
import { plural } from "@/lib/format";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { respaldo as repoRespaldo } from "@/lib/repositories";
import { useAvisos } from "./Avisos";
import { IconoBasura, IconoCheck, IconoHistorial } from "./iconos";
import { Boton, Rotulo, Tarjeta, juntar } from "./ui";

/**
 * Estado real de los datos: dónde viven, si el navegador puede borrarlos y
 * cómo sacarlos de aquí.
 *
 * Se enseña sin adornos porque la respuesta honesta es incómoda: todo está en
 * un solo navegador de un solo dispositivo, y hasta la Fase 2 no hay copia en
 * la nube.
 */

/**
 * El navegador no avisa cuando cambia la persistencia, así que la relectura la
 * disparamos nosotros al concederla.
 */
const oyentes = new Set<() => void>();
let revision = 0;

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

function refrescar(): void {
  revision += 1;
  for (const alCambiar of oyentes) alCambiar();
}

export function TarjetaDatos() {
  const userId = useUsuarioActual();
  const { avisar } = useAvisos();
  const entrada = useRef<HTMLInputElement>(null);
  const [trabajando, setTrabajando] = useState(false);

  const marca = useSyncExternalStore(
    suscribir,
    () => revision,
    () => 0,
  );

  const estado = useDatos<EstadoAlmacenamiento>(() => consultarAlmacenamiento(), [marca]);

  async function protegerDatos() {
    const concedido = await pedirAlmacenamientoPersistente();
    refrescar();
    avisar({
      mensaje: concedido
        ? "Listo: el navegador ya no borrará tus datos para hacer sitio"
        : "El navegador no lo ha concedido. Instala la app y vuelve a intentarlo.",
      tono: concedido ? "exito" : "neutro",
    });
  }

  async function exportar() {
    setTrabajando(true);
    try {
      const copia = await repoRespaldo.exportarRespaldo(userId);
      const blob = new Blob([JSON.stringify(copia)], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = repoRespaldo.nombreDeArchivo();
      enlace.click();
      URL.revokeObjectURL(url);

      avisar({ mensaje: "Copia descargada", tono: "exito" });
    } finally {
      setTrabajando(false);
    }
  }

  async function importar(archivo: File) {
    setTrabajando(true);
    try {
      const resultado = await repoRespaldo.importarRespaldo(userId, JSON.parse(await archivo.text()));
      avisar({
        mensaje: `${plural(resultado.anadidas, "registro añadido", "registros añadidos")} · ${plural(resultado.actualizadas, "actualizado", "actualizados")}`,
        tono: "exito",
      });
    } catch (error) {
      avisar({
        mensaje:
          error instanceof repoRespaldo.ErrorRespaldo
            ? error.message
            : "No se pudo leer el archivo.",
        tono: "peligro",
      });
    } finally {
      setTrabajando(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  const persistente = estado?.persistente ?? false;

  return (
    <Tarjeta>
      <Rotulo className="mb-3">Tus datos</Rotulo>

      <div
        className={juntar(
          "flex items-start gap-3 rounded-lg border p-3",
          persistente ? "border-exito/40 bg-exito/5" : "border-aviso/40 bg-aviso/5",
        )}
      >
        <span
          className={juntar(
            "grid size-8 shrink-0 place-items-center rounded",
            persistente ? "bg-exito text-tinta" : "bg-aviso text-tinta",
          )}
        >
          {persistente ? <IconoCheck width={16} height={16} /> : <IconoHistorial width={16} height={16} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="titulo-sm">
            {persistente ? "Almacenamiento protegido" : "Almacenamiento sin proteger"}
          </p>
          <p className="mt-1 text-sm text-suave">
            {persistente
              ? "Tus entrenamientos sobreviven a cerrar el navegador y solo se borran si los borras tú."
              : "Se guardan en este navegador y sobreviven a reiniciarlo, pero el navegador puede borrarlos si necesita espacio."}
          </p>

          {estado?.usadoBytes != null && (
            <p className="etiqueta-caps mt-2 text-suave">
              {formatearBytes(estado.usadoBytes)} usados
              {estado.cuotaBytes != null && ` de ${formatearBytes(estado.cuotaBytes)}`}
            </p>
          )}

          {!persistente && estado?.soportado && (
            <Boton ancho className="mt-3" onClick={() => void protegerDatos()}>
              Proteger mis datos
            </Boton>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-suave">
        No hay copia en la nube todavía: si pierdes este dispositivo, pierdes el registro.
        Descárgate una copia de vez en cuando y guárdala donde quieras.
      </p>

      <input
        ref={entrada}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) void importar(archivo);
        }}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Boton disabled={trabajando} onClick={() => void exportar()}>
          Exportar copia
        </Boton>
        <Boton disabled={trabajando} onClick={() => entrada.current?.click()}>
          Importar copia
        </Boton>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-suave">
        <IconoBasura width={13} height={13} className="mt-0.5 shrink-0" />
        La copia lleva rutinas, series, récords y enlaces, pero no los vídeos ni las imágenes
        que hayas grabado tú: esos se quedan en el dispositivo.
      </p>
    </Tarjeta>
  );
}
