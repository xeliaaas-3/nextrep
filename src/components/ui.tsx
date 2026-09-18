"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { IconoAtras } from "./iconos";

/**
 * Piezas de interfaz compartidas, según docs/DESIGN.md.
 *
 * Reglas que se repiten en todas: 48px de objetivo táctil como mínimo, radios
 * cortos (4px en chips, 8px en tarjetas y botones) y contraste por planos
 * sólidos con un borde de 1px, nunca por sombras difusas.
 */

export function juntar(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

type Variante = "primario" | "secundario" | "fantasma" | "peligro";

const VARIANTES: Record<Variante, string> = {
  // Lima sólido sobre tinta carbón: la única acción que manda en la pantalla.
  primario: "bg-acento text-tinta font-bold active:scale-[0.98] active:brightness-90",
  secundario: "bg-superficie-2 text-texto border border-borde-fuerte active:bg-superficie-3",
  fantasma: "text-suave active:bg-superficie-2",
  peligro: "bg-transparent text-peligro border border-peligro/20 active:bg-peligro active:text-tinta",
};

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  ancho?: boolean;
}

export function Boton({
  variante = "secundario",
  ancho = false,
  className,
  ...props
}: PropsBoton) {
  return (
    <button
      {...props}
      className={juntar(
        "tactil inline-flex items-center justify-center gap-2 rounded-lg px-4 transition",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTES[variante],
        ancho && "w-full",
        className,
      )}
    />
  );
}

export function BotonEnlace({
  href,
  variante = "secundario",
  ancho = false,
  className,
  children,
}: {
  href: string;
  variante?: Variante;
  ancho?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={juntar(
        "tactil inline-flex items-center justify-center gap-2 rounded-lg px-4 transition",
        VARIANTES[variante],
        ancho && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Nivel 1: módulos agrupados y tarjetas en reposo. */
export function Tarjeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={juntar("rounded-lg border border-borde bg-superficie p-4", className)}>
      {children}
    </div>
  );
}

/** Rótulo meta en mayúsculas: SERIE, CARGA, VOLUMEN SEMANAL... */
export function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={juntar("etiqueta-caps text-suave", className)}>{children}</p>;
}

export function Cabecera({
  titulo,
  subtitulo,
  atras,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  atras?: string | true;
  accion?: ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 mb-3 flex items-center gap-2 border-b border-borde bg-fondo/90 px-4 py-3 backdrop-blur-xl lg:py-5">
      {atras !== undefined &&
        (atras === true ? (
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.back()}
            className="tactil -ml-2 grid place-items-center rounded-lg text-suave active:bg-superficie-2"
          >
            <IconoAtras />
          </button>
        ) : (
          <Link
            href={atras}
            aria-label="Volver"
            className="tactil -ml-2 grid place-items-center rounded-lg text-suave active:bg-superficie-2"
          >
            <IconoAtras />
          </Link>
        ))}

      <div className="min-w-0 flex-1">
        <h1 className="titulo-sm truncate uppercase tracking-tight">{titulo}</h1>
        {subtitulo && <p className="truncate text-sm text-suave">{subtitulo}</p>}
      </div>

      {accion}
    </header>
  );
}

/**
 * Estado vacío. Explica el siguiente paso en vez de decorar: si no hay nada,
 * lo útil es saber qué hacer, no ver un dibujo.
 */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="mx-4 rounded-lg border border-dashed border-borde-fuerte px-6 py-10 text-center">
      <p className="titulo-sm">{titulo}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-suave">{descripcion}</p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}

export function Campo({
  etiqueta,
  error,
  ayuda,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}) {
  return (
    <label className="block">
      <span className="etiqueta-caps mb-2 block text-suave">{etiqueta}</span>
      <input
        {...props}
        className={juntar(
          "tactil w-full rounded-lg border bg-superficie-2 px-3 outline-none transition",
          "focus:border-acento",
          error ? "border-peligro" : "border-borde-fuerte",
          className,
        )}
      />
      {error ? (
        <span className="mt-1.5 block text-sm text-peligro">{error}</span>
      ) : ayuda ? (
        <span className="mt-1.5 block text-sm text-suave">{ayuda}</span>
      ) : null}
    </label>
  );
}

/** Chip informativo. Radio corto: es instrumentación, no decoración. */
export function Etiqueta({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={juntar(
        "etiqueta-caps inline-flex items-center gap-1.5 rounded border border-borde bg-superficie-2 px-2 py-1 text-suave",
        className,
      )}
    >
      {color && <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/** Píldora de estado con punto latiendo: conexión, sesión en curso, offline. */
export function Pip({
  children,
  tono = "acento",
}: {
  children: ReactNode;
  tono?: "acento" | "aviso" | "exito";
}) {
  const color = tono === "aviso" ? "bg-aviso" : tono === "exito" ? "bg-exito" : "bg-acento";
  return (
    <span className="etiqueta-caps inline-flex items-center gap-1.5 rounded-full bg-superficie-2 px-2.5 py-1 text-suave">
      <span aria-hidden className={juntar("size-1.5 animar-pulso rounded-full", color)} />
      {children}
    </span>
  );
}

/** Fila de filtros horizontal, desplazable con el pulgar. */
export function Filtros<T extends string>({
  opciones,
  valor,
  alCambiar,
}: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T;
  alCambiar: (valor: T) => void;
}) {
  return (
    <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          onClick={() => alCambiar(opcion.valor)}
          className={juntar(
            "etiqueta-md shrink-0 rounded border px-3 py-2 transition",
            valor === opcion.valor
              ? "border-acento bg-acento font-semibold text-tinta"
              : "border-borde bg-superficie text-suave",
          )}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}

/** Barra de progreso fina. Se usa para avance de sesión y volumen. */
export function Barra({
  porcentaje,
  color = "var(--acento)",
  className,
}: {
  porcentaje: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={juntar("block h-1.5 overflow-hidden rounded-full bg-superficie-3", className)}
    >
      <span
        className="block h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%`, background: color }}
      />
    </span>
  );
}

export function Cargando() {
  return (
    <div className="space-y-3 px-4 py-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-superficie" />
      ))}
    </div>
  );
}
