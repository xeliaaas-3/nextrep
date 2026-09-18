"use client";

import { useRouter } from "next/navigation";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { rutinas as repoRutinas, sesiones as repoSesiones } from "@/lib/repositories";
import { plural } from "@/lib/format";
import { ahora, formatearDuracion, tiempoRelativo } from "@/lib/time";
import type { UUID } from "@/lib/types";
import { IconoAdelante, IconoMancuerna, IconoRayo } from "@/components/iconos";
import { Boton, Cabecera, Cargando, EstadoVacio, Tarjeta } from "@/components/ui";

/** Punto de partida del entrenamiento: continuar, elegir rutina o sesión libre. */
export default function PaginaEntrenar() {
  const userId = useUsuarioActual();
  const router = useRouter();

  const datos = useDatos(async () => {
    const activa = await repoSesiones.getActiveSession(userId);
    const lista = await repoRutinas.getRoutinesByUser(userId);
    const conteo = await repoRutinas.countExercisesByRoutine(userId);
    const siguiente = await repoSesiones.getNextRoutineIdInRotation(
      userId,
      lista.map((r) => r.id),
    );
    return { activa, lista, conteo, siguiente };
  }, [userId]);

  async function empezar(routineId: UUID | null) {
    const sesion = await repoSesiones.startSession(userId, routineId);
    router.push(`/entrenar/${sesion.id}`);
  }

  if (!datos) return <Cargando />;

  const { activa, lista, conteo, siguiente } = datos;

  return (
    <>
      <Cabecera titulo="Entrenar" />

      <div className="space-y-4 px-4">
        {activa && (
          <Tarjeta className="border-acento/40 bg-acento/5">
            <p className="text-sm text-suave">Tienes un entrenamiento en curso</p>
            <p className="mt-1 font-medium tabular-nums">
              Empezado {tiempoRelativo(activa.startedAt)} ·{" "}
              {formatearDuracion(activa.startedAt, ahora())}
            </p>
            <Boton
              variante="primario"
              ancho
              className="mt-3"
              onClick={() => router.push(`/entrenar/${activa.id}`)}
            >
              Continuar
              <IconoAdelante width={18} height={18} />
            </Boton>
          </Tarjeta>
        )}

        {lista.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no tienes rutinas"
            descripcion="Crea una rutina con tus ejercicios, o empieza una sesión libre y ve añadiéndolos sobre la marcha."
            accion={
              <Boton variante="primario" onClick={() => router.push("/rutinas")}>
                Crear una rutina
              </Boton>
            }
          />
        ) : (
          <section>
            <h2 className="mb-2 text-sm font-medium text-suave">Elegir rutina</h2>
            <ul className="space-y-2">
              {lista.map((rutina) => {
                const esSiguiente = rutina.id === siguiente;
                return (
                  <li key={rutina.id}>
                    <button
                      type="button"
                      onClick={() => void empezar(rutina.id)}
                      className="tactil flex w-full items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 text-left active:bg-superficie-2"
                    >
                      <IconoMancuerna className="shrink-0 text-suave" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{rutina.name}</span>
                          {esSiguiente && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-acento px-2 py-0.5 text-[11px] font-semibold text-tinta">
                              <IconoRayo width={12} height={12} />
                              Toca hoy
                            </span>
                          )}
                        </span>
                        <span className="block text-sm text-suave">
                          {plural(conteo.get(rutina.id) ?? 0, "ejercicio", "ejercicios")}
                        </span>
                      </span>
                      <IconoAdelante className="shrink-0 text-suave" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <Boton ancho onClick={() => void empezar(null)}>
          Sesión libre, sin rutina
        </Boton>
      </div>
    </>
  );
}
