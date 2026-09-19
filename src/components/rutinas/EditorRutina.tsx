"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COLOR_GRUPO, etiquetaGrupo, formatearDescanso, plural } from "@/lib/format";
import { useDatos, useAjustes, useUsuarioActual } from "@/lib/hooks";
import { ejercicios as repoEjercicios, rutinas as repoRutinas } from "@/lib/repositories";
import type { Exercise, RoutineExercise, UUID } from "@/lib/types";
import { useAvisos } from "../Avisos";
import { IconoArrastrar, IconoBasura, IconoMas } from "../iconos";
import { SelectorEjercicio } from "../SelectorEjercicio";
import { Boton, Cabecera, Cargando, EstadoVacio, juntar } from "../ui";

/**
 * Ajustes por defecto al añadir un ejercicio a la rutina. Los que se miden en
 * tiempo arrancan en segundos razonables, no en "8 repeticiones".
 */
const POR_DEFECTO = { targetSets: 3, repRangeMin: 8, repRangeMax: 12 };
const POR_DEFECTO_TIEMPO = { targetSets: 2, repRangeMin: 20, repRangeMax: 45 };

export function EditorRutina({ routineId }: { routineId: UUID }) {
  const userId = useUsuarioActual();
  const router = useRouter();
  const { avisar } = useAvisos();
  const { defaultRestSeconds } = useAjustes();

  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [abierto, setAbierto] = useState<UUID | null>(null);
  // Orden optimista mientras se arrastra. `null` significa "usa el de la base".
  const [ordenLocal, setOrdenLocal] = useState<UUID[] | null>(null);

  const datos = useDatos(async () => {
    const rutina = await repoRutinas.getRoutineById(routineId, userId);
    if (!rutina) return null;

    const filas = await repoRutinas.getRoutineExercises(routineId);
    const catalogo = await repoEjercicios.getExercisesByIds(filas.map((f) => f.exerciseId));

    return { rutina, filas, catalogo };
  }, [routineId, userId]);

  const sensores = useSensors(
    // Un umbral de 8px evita que un toque para editar se interprete como arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (datos === undefined) return <Cargando />;

  if (datos === null) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-medium">Esta rutina ya no existe</p>
        <Boton className="mt-4" onClick={() => router.replace("/rutinas")}>
          Volver a rutinas
        </Boton>
      </div>
    );
  }

  const { rutina, filas, catalogo } = datos;
  const porId = new Map(filas.map((f) => [f.id, f]));

  // El orden optimista solo vale mientras contenga exactamente las mismas
  // filas que la base; si se añade o se quita una, manda la base.
  const orden =
    ordenLocal &&
    ordenLocal.length === filas.length &&
    ordenLocal.every((id) => porId.has(id))
      ? ordenLocal
      : filas.map((f) => f.id);

  const ordenadas = orden.map((id) => porId.get(id)).filter((f): f is RoutineExercise => !!f);

  async function alSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;

    const desde = orden.indexOf(active.id as UUID);
    const hasta = orden.indexOf(over.id as UUID);
    const nuevo = arrayMove(orden, desde, hasta);

    setOrdenLocal(nuevo);
    await repoRutinas.reorderRoutineExercises(nuevo);
  }

  async function anadir(ejercicio: Exercise) {
    setSelectorAbierto(false);
    const fila = await repoRutinas.addExerciseToRoutine(routineId, userId, {
      exerciseId: ejercicio.id,
      ...(ejercicio.tracking === "tiempo" ? POR_DEFECTO_TIEMPO : POR_DEFECTO),
      restSeconds: defaultRestSeconds,
      notes: "",
    });
    setAbierto(fila.id);
  }

  async function quitar(fila: RoutineExercise) {
    const nombre = catalogo.get(fila.exerciseId)?.name ?? "El ejercicio";
    await repoRutinas.removeExerciseFromRoutine(fila.id);

    avisar({
      mensaje: `${nombre} quitado de la rutina`,
      accion: {
        etiqueta: "Deshacer",
        alPulsar: () => {
          void repoRutinas.addExerciseToRoutine(routineId, userId, {
            exerciseId: fila.exerciseId,
            targetSets: fila.targetSets,
            repRangeMin: fila.repRangeMin,
            repRangeMax: fila.repRangeMax,
            restSeconds: fila.restSeconds,
            notes: fila.notes,
          });
        },
      },
    });
  }

  async function borrarRutina() {
    await repoRutinas.deleteRoutine(routineId);
    router.replace("/rutinas");
    avisar({ mensaje: `Rutina "${rutina.name}" eliminada` });
  }

  return (
    <>
      <Cabecera
        titulo={rutina.name}
        subtitulo={plural(filas.length, "ejercicio", "ejercicios")}
        atras="/rutinas"
        accion={
          <Boton variante="primario" onClick={() => setSelectorAbierto(true)} aria-label="Añadir ejercicio">
            <IconoMas width={20} height={20} />
          </Boton>
        }
      />

      <div className="space-y-4 px-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-suave">Nombre</span>
          <input
            defaultValue={rutina.name}
            onBlur={(e) => {
              const valor = e.target.value.trim();
              if (valor !== "" && valor !== rutina.name) {
                void repoRutinas.updateRoutine(routineId, {
                  name: valor,
                  description: rutina.description,
                });
              } else {
                e.target.value = rutina.name;
              }
            }}
            className="tactil w-full rounded-lg border border-borde bg-superficie-2 px-3 outline-none focus:border-acento"
          />
        </label>

        {ordenadas.length === 0 ? (
          <EstadoVacio
            titulo="Esta rutina está vacía"
            descripcion="Añade los ejercicios que haces en este día, con sus series y su rango de repeticiones."
            accion={
              <Boton variante="primario" onClick={() => setSelectorAbierto(true)}>
                <IconoMas width={18} height={18} />
                Añadir ejercicio
              </Boton>
            }
          />
        ) : (
          <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={(e) => void alSoltar(e)}>
            <SortableContext items={orden} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {ordenadas.map((fila) => (
                  <FilaEjercicio
                    key={fila.id}
                    fila={fila}
                    ejercicio={catalogo.get(fila.exerciseId)}
                    abierto={abierto === fila.id}
                    alAbrir={() => setAbierto(abierto === fila.id ? null : fila.id)}
                    alQuitar={() => void quitar(fila)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <Boton variante="peligro" ancho onClick={() => void borrarRutina()}>
          <IconoBasura width={18} height={18} />
          Eliminar rutina
        </Boton>
      </div>

      {selectorAbierto && (
        <SelectorEjercicio
          excluir={filas.map((f) => f.exerciseId)}
          alCerrar={() => setSelectorAbierto(false)}
          alElegir={(ejercicio) => void anadir(ejercicio)}
        />
      )}
    </>
  );
}

function FilaEjercicio({
  fila,
  ejercicio,
  abierto,
  alAbrir,
  alQuitar,
}: {
  fila: RoutineExercise;
  ejercicio: Exercise | undefined;
  abierto: boolean;
  alAbrir: () => void;
  alQuitar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fila.id,
  });

  const estilo = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  async function guardar(cambios: Partial<RoutineExercise>) {
    const siguiente = { ...fila, ...cambios };
    await repoRutinas.updateRoutineExercise(fila.id, {
      exerciseId: siguiente.exerciseId,
      targetSets: siguiente.targetSets,
      repRangeMin: siguiente.repRangeMin,
      // El máximo nunca puede quedar por debajo del mínimo.
      repRangeMax: Math.max(siguiente.repRangeMin, siguiente.repRangeMax),
      restSeconds: siguiente.restSeconds,
      notes: siguiente.notes,
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={estilo}
      className={juntar(
        "rounded-lg border border-borde bg-superficie",
        isDragging && "opacity-90 shadow-lg shadow-black/40",
      )}
    >
      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          aria-label="Reordenar"
          className="tactil grid cursor-grab touch-none place-items-center px-1 text-suave"
          {...attributes}
          {...listeners}
        >
          <IconoArrastrar width={20} height={20} />
        </button>

        <button type="button" onClick={alAbrir} className="min-w-0 flex-1 py-3 text-left">
          <span className="flex items-center gap-2">
            {ejercicio && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: COLOR_GRUPO[ejercicio.muscleGroup] }}
              />
            )}
            <span className="truncate font-medium">{ejercicio?.name ?? "Ejercicio"}</span>
          </span>
          <span className="block text-sm text-suave">
            {fila.targetSets} × {fila.repRangeMin}-{fila.repRangeMax}{" "}
            {ejercicio?.tracking === "tiempo" ? "s" : "reps"} ·{" "}
            {formatearDescanso(fila.restSeconds)} de descanso
          </span>
        </button>

        <button
          type="button"
          onClick={alQuitar}
          aria-label="Quitar de la rutina"
          className="tactil grid place-items-center rounded-lg px-2 text-suave active:bg-superficie-2"
        >
          <IconoBasura width={18} height={18} />
        </button>
      </div>

      {abierto && (
        <div className="animar-aparecer space-y-3 border-t border-borde px-3 py-3">
          {ejercicio && (
            <p className="text-xs text-suave">{etiquetaGrupo(ejercicio.muscleGroup)}</p>
          )}

          <Contador
            etiqueta="Series"
            valor={fila.targetSets}
            min={1}
            max={20}
            alCambiar={(v) => void guardar({ targetSets: v })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Contador
              etiqueta={ejercicio?.tracking === "tiempo" ? "Seg. mín." : "Reps mín."}
              valor={fila.repRangeMin}
              min={1}
              max={600}
              paso={ejercicio?.tracking === "tiempo" ? 5 : 1}
              alCambiar={(v) => void guardar({ repRangeMin: v })}
            />
            <Contador
              etiqueta={ejercicio?.tracking === "tiempo" ? "Seg. máx." : "Reps máx."}
              valor={fila.repRangeMax}
              min={1}
              max={600}
              paso={ejercicio?.tracking === "tiempo" ? 5 : 1}
              alCambiar={(v) => void guardar({ repRangeMax: v })}
            />
          </div>

          <Contador
            etiqueta="Descanso (segundos)"
            valor={fila.restSeconds}
            min={0}
            max={900}
            paso={15}
            alCambiar={(v) => void guardar({ restSeconds: v })}
          />
        </div>
      )}
    </li>
  );
}

/** Contador con botones grandes: se usa con el pulgar, no con el teclado. */
function Contador({
  etiqueta,
  valor,
  min,
  max,
  paso = 1,
  alCambiar,
}: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  alCambiar: (valor: number) => void;
}) {
  const ajustar = (delta: number) => alCambiar(Math.min(max, Math.max(min, valor + delta)));

  return (
    <div>
      <p className="mb-1.5 text-sm text-suave">{etiqueta}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => ajustar(-paso)}
          aria-label={`Bajar ${etiqueta}`}
          className="tactil grid flex-1 place-items-center rounded-lg border border-borde text-lg active:bg-borde"
        >
          −
        </button>
        <span className="w-14 text-center text-lg font-medium tabular-nums">{valor}</span>
        <button
          type="button"
          onClick={() => ajustar(paso)}
          aria-label={`Subir ${etiqueta}`}
          className="tactil grid flex-1 place-items-center rounded-lg border border-borde text-lg active:bg-borde"
        >
          +
        </button>
      </div>
    </div>
  );
}
