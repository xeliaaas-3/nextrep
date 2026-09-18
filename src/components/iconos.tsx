import type { SVGProps } from "react";

/**
 * Iconos en línea. Van dentro del bundle en vez de venir de una librería:
 * son pocos y así no añadimos peso al arranque, que debe ser inmediato.
 */

type Props = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      width={24}
      height={24}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoHoy = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Base>
);

export const IconoRutinas = (p: Props) => (
  <Base {...p}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </Base>
);

export const IconoMancuerna = (p: Props) => (
  <Base {...p}>
    <path d="M3 9v6M6.5 7v10M17.5 7v10M21 9v6M6.5 12h11" />
  </Base>
);

export const IconoProgreso = (p: Props) => (
  <Base {...p}>
    <path d="M4 19V5M4 19h16" />
    <path d="M8 16l4-6 3 3 5-7" />
  </Base>
);

export const IconoAjustes = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const IconoMas = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconoCheck = (p: Props) => (
  <Base {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Base>
);

export const IconoAtras = (p: Props) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconoAdelante = (p: Props) => (
  <Base {...p}>
    <path d="M9 5l7 7-7 7" />
  </Base>
);

export const IconoBuscar = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Base>
);

export const IconoBasura = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Base>
);

export const IconoArrastrar = (p: Props) => (
  <Base {...p}>
    <circle cx="9" cy="6" r="1.2" fill="currentColor" />
    <circle cx="15" cy="6" r="1.2" fill="currentColor" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" />
    <circle cx="9" cy="18" r="1.2" fill="currentColor" />
    <circle cx="15" cy="18" r="1.2" fill="currentColor" />
  </Base>
);

export const IconoCronometro = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M9 2h6" />
  </Base>
);

export const IconoRayo = (p: Props) => (
  <Base {...p}>
    <path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" />
  </Base>
);

export const IconoTrofeo = (p: Props) => (
  <Base {...p}>
    <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
    <path d="M7 6H4v1a4 4 0 004 4M17 6h3v1a4 4 0 01-4 4M10 19h4M12 14v5M9 21h6" />
  </Base>
);

export const IconoLlama = (p: Props) => (
  <Base {...p}>
    <path d="M12 3c1 3.5 4.5 4.5 4.5 8.5A4.5 4.5 0 0112 16a4.5 4.5 0 01-4.5-4.5C7.5 9 9 8 9.5 6c1.5 1 2.5 0 2.5-3z" />
    <path d="M12 16c2.5 0 4 1.5 4 3H8c0-1.5 1.5-3 4-3z" />
  </Base>
);

export const IconoLapiz = (p: Props) => (
  <Base {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M14.5 5.5l4 4" />
  </Base>
);

export const IconoOpciones = (p: Props) => (
  <Base {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Base>
);

export const IconoReproducir = (p: Props) => (
  <Base {...p}>
    <path d="M8 5.5v13l11-6.5-11-6.5z" />
  </Base>
);

export const IconoVideo = (p: Props) => (
  <Base {...p}>
    <rect x="2" y="6" width="14" height="12" rx="2.5" />
    <path d="M16 10.5l6-3.5v10l-6-3.5" />
  </Base>
);

export const IconoImagen = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 16l-5-5-6.5 7" />
  </Base>
);

export const IconoBajar = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12l7 7 7-7" />
  </Base>
);

export const IconoCerrar = (p: Props) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconoHistorial = (p: Props) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </Base>
);

export const IconoDeshacer = (p: Props) => (
  <Base {...p}>
    <path d="M9 14l-4-4 4-4" />
    <path d="M5 10h8a6 6 0 110 12h-3" />
  </Base>
);
