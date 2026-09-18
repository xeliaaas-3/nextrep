"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoHoy, IconoMancuerna, IconoOpciones, IconoProgreso, IconoRutinas } from "./iconos";
import { juntar } from "./ui";

/**
 * Zona fija inferior de 56px con "Entrenar" como acción elevada en el centro.
 *
 * Va abajo y no arriba porque la app se maneja con el pulgar de una mano; el
 * botón central sobresale para que sea el objetivo más fácil de acertar sin
 * mirar.
 */

const PESTANAS = [
  { href: "/", etiqueta: "Hoy", Icono: IconoHoy },
  { href: "/rutinas", etiqueta: "Rutinas", Icono: IconoRutinas },
  { href: "/progreso", etiqueta: "Progreso", Icono: IconoProgreso },
  { href: "/mas", etiqueta: "Más", Icono: IconoOpciones },
] as const;

export function NavegacionInferior() {
  const ruta = usePathname();

  // El modo entrenamiento ocupa toda la pantalla: nada debe distraer de las
  // series ni robar espacio al pulgar.
  if (ruta.startsWith("/entrenar/")) return null;

  const activa = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-5 items-end">
        {PESTANAS.slice(0, 2).map(({ href, etiqueta, Icono }) => (
          <li key={href}>
            <Pestana href={href} etiqueta={etiqueta} Icono={Icono} activa={activa(href)} />
          </li>
        ))}

        <li className="flex justify-center">
          <Link
            href="/entrenar"
            aria-label="Entrenar"
            aria-current={ruta.startsWith("/entrenar") ? "page" : undefined}
            className="tactil -mt-5 grid size-14 place-items-center rounded-lg bg-acento text-tinta shadow-[0_0_20px_rgb(144_19_232/0.45)] transition active:scale-95"
          >
            <IconoMancuerna width={26} height={26} />
          </Link>
        </li>

        {PESTANAS.slice(2).map(({ href, etiqueta, Icono }) => (
          <li key={href}>
            <Pestana href={href} etiqueta={etiqueta} Icono={Icono} activa={activa(href)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Pestana({
  href,
  etiqueta,
  Icono,
  activa,
}: {
  href: string;
  etiqueta: string;
  Icono: (p: { width?: number; height?: number }) => React.ReactElement;
  activa: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={juntar(
        "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
        activa ? "text-acento-texto" : "text-suave",
      )}
    >
      <Icono width={22} height={22} />
      {etiqueta}
    </Link>
  );
}
