"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import {
  IconoHoy,
  IconoMancuerna,
  IconoOpciones,
  IconoProgreso,
  IconoRutinas,
} from "./iconos";
import { juntar } from "./ui";

/**
 * Navegación de escritorio.
 *
 * En una pantalla grande la barra inferior no tiene sentido: el pulgar no
 * manda y el ratón llega igual de lejos a cualquier sitio. La lateral deja
 * todas las secciones visibles a la vez y devuelve el alto de la ventana al
 * contenido, que es lo que escasea en un portátil.
 *
 * Solo existe a partir de `lg`; por debajo manda la barra inferior.
 */

const SECCIONES = [
  { href: "/", etiqueta: "Hoy", Icono: IconoHoy },
  { href: "/rutinas", etiqueta: "Rutinas", Icono: IconoRutinas },
  { href: "/progreso", etiqueta: "Progreso", Icono: IconoProgreso },
  { href: "/mas", etiqueta: "Más", Icono: IconoOpciones },
] as const;

export function NavegacionLateral() {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-borde bg-superficie px-3 py-5 lg:flex">
      <Link href="/" className="mb-8 px-3">
        <Logo size={30} />
      </Link>

      <Link
        href="/entrenar"
        aria-current={ruta.startsWith("/entrenar") ? "page" : undefined}
        className="tactil mb-6 flex items-center justify-center gap-2 rounded-lg bg-acento px-4 font-bold text-tinta transition active:scale-[0.98] active:brightness-90"
      >
        <IconoMancuerna width={20} height={20} />
        Entrenar
      </Link>

      <nav>
        <ul className="space-y-1">
          {SECCIONES.map(({ href, etiqueta, Icono }) => {
            const esta = activa(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={esta ? "page" : undefined}
                  className={juntar(
                    "tactil flex items-center gap-3 rounded-lg px-3 transition",
                    esta
                      ? "bg-acento/10 font-semibold text-acento-texto"
                      : "text-suave hover:bg-superficie-2",
                  )}
                >
                  <Icono width={20} height={20} />
                  {etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="etiqueta-caps mt-auto px-3 text-suave/60">
        Tus datos se quedan en este dispositivo
      </p>
    </aside>
  );
}
