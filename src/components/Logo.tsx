import { juntar } from "./ui";

/**
 * Marca de NextRep: dos flechas que se persiguen alrededor de una mancuerna.
 *
 * Va en SVG en línea y no como imagen: pesa nada, escala sin perder filo y no
 * depende de una descarga, así que también se ve sin conexión. Los colores son
 * tokens, no valores fijos, para que la marca funcione en tema claro y oscuro.
 *
 * Las rutas salen del mismo cálculo que genera los PNG del icono
 * (`scripts` del repositorio), así que las dos versiones no se desalinean.
 */

const ARCO_ACENTO =
  "M66.27 13.46 A40 40 0 0 0 22.21 78.77 L29.85 70.86 A29 29 0 0 1 61.8 23.51 Z " +
  "M35.39 83.85 L19.44 81.65 L32.63 67.98 Z";

const ARCO_CLARO =
  "M33.73 86.54 A40 40 0 0 0 77.79 21.23 L70.15 29.14 A29 29 0 0 1 38.2 76.49 Z " +
  "M64.61 16.15 L80.56 18.35 L67.37 32.02 Z";

export function Isotipo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="NextRep"
    >
      <path d={ARCO_ACENTO} fill="var(--acento)" />
      <path d={ARCO_CLARO} fill="var(--texto)" />

      {/* Mancuerna */}
      <g fill="var(--texto)">
        <rect x="40" y="47.5" width="20" height="5" rx="1.5" />
        <rect x="34.5" y="40" width="5.5" height="20" rx="1.8" />
        <rect x="60" y="40" width="5.5" height="20" rx="1.8" />
        <rect x="29.5" y="43.75" width="4.2" height="12.5" rx="1.5" />
        <rect x="66.3" y="43.75" width="4.2" height="12.5" rx="1.5" />
      </g>
    </svg>
  );
}

/** Isotipo más logotipo, para cabeceras y pantallas de marca. */
export function Logo({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={juntar("inline-flex items-center gap-2", className)}>
      <Isotipo size={size} />
      <span className="titulo-sm tracking-tight" aria-hidden>
        Next<span className="text-acento-texto">Rep</span>
      </span>
    </span>
  );
}
