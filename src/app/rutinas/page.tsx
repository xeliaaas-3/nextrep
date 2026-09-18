"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAvisos } from "@/components/Avisos";
import { IconoAdelante, IconoMas } from "@/components/iconos";
import { Boton, Cabecera, Campo, Cargando, EstadoVacio } from "@/components/ui";
import { plural } from "@/lib/format";
import { useDatos, useUsuarioActual } from "@/lib/hooks";
import { rutinas as repoRutinas } from "@/lib/repositories";

/** Lista de rutinas y creación de una nueva. */
export default function PaginaRutinas() {
  const userId = useUsuarioActual();
  const router = useRouter();
  const { avisar } = useAvisos();

  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | undefined>();

  const datos = useDatos(async () => {
    const lista = await repoRutinas.getRoutinesByUser(userId);
    const conteo = await repoRutinas.countExercisesByRoutine(userId);
    return { lista, conteo };
  }, [userId]);

  async function crear() {
    const limpio = nombre.trim();
    if (limpio === "") {
      setError("Ponle un nombre a la rutina");
      return;
    }

    const rutina = await repoRutinas.createRoutine(userId, { name: limpio, description: "" });
    setNombre("");
    setCreando(false);
    setError(undefined);
    avisar({ mensaje: `Rutina "${rutina.name}" creada`, tono: "exito" });
    router.push(`/rutinas/${rutina.id}`);
  }

  if (!datos) return <Cargando />;

  const { lista, conteo } = datos;

  return (
    <>
      <Cabecera
        titulo="Rutinas"
        accion={
          <Boton
            variante="primario"
            onClick={() => setCreando((v) => !v)}
            aria-label="Nueva rutina"
          >
            <IconoMas width={20} height={20} />
          </Boton>
        }
      />

      <div className="space-y-4 px-4">
        {creando && (
          <div className="animar-aparecer space-y-3 rounded-lg border border-borde bg-superficie p-4">
            <Campo
              etiqueta="Nombre de la rutina"
              placeholder="Push A, Pierna, Torso..."
              autoFocus
              value={nombre}
              error={error}
              onChange={(e) => {
                setNombre(e.target.value);
                setError(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void crear();
              }}
            />
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

        {lista.length === 0 && !creando ? (
          <EstadoVacio
            titulo="Todavía no tienes rutinas"
            descripcion="Una rutina es una lista de ejercicios con sus series y repeticiones. Crea la primera y ya podrás entrenar con ella."
            accion={
              <Boton variante="primario" onClick={() => setCreando(true)}>
                <IconoMas width={18} height={18} />
                Nueva rutina
              </Boton>
            }
          />
        ) : (
          <ul className="space-y-2">
            {lista.map((rutina) => (
              <li key={rutina.id}>
                <Link
                  href={`/rutinas/${rutina.id}`}
                  className="tactil flex items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 active:bg-superficie-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{rutina.name}</span>
                    <span className="block text-sm text-suave">
                      {plural(conteo.get(rutina.id) ?? 0, "ejercicio", "ejercicios")}
                    </span>
                  </span>
                  <IconoAdelante className="shrink-0 text-suave" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="px-1 text-sm text-suave">
          El orden de esta lista es la rotación: al terminar una rutina, la app te propone la
          siguiente.
        </p>
      </div>
    </>
  );
}
