import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ArranqueApp } from "@/components/ArranqueApp";
import { NavegacionInferior } from "@/components/NavegacionInferior";
import { NavegacionLateral } from "@/components/NavegacionLateral";
import { ProveedorAvisos } from "@/components/Avisos";
import { SCRIPT_TEMA } from "@/lib/tema";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Space Grotesk carga por `next/font`, que la auto-aloja. Traerla del CDN de
// Google rompería el arranque sin conexión, que es el requisito no negociable.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "NextRep",
  description: "Registra tus series mientras entrenas. Funciona sin conexión.",
  // El <link rel="manifest"> lo inserta Next a partir de `src/app/manifest.ts`.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NextRep" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a0e",
  // La app ocupa toda la pantalla, incluida la zona del notch.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Evita el zoom por doble toque al pulsar rápido entre series.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Aplica el tema antes de pintar. Sin esto la app arranca en oscuro y
          salta al claro en cuanto IndexedDB responde.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col bg-fondo text-texto">
        <ProveedorAvisos>
          <ArranqueApp />
          <NavegacionLateral />

          {/*
            En móvil, columna de 480px: el alcance del pulgar es el mismo en
            cualquier teléfono. En escritorio se reserva el hueco de la barra
            lateral y la columna se ensancha, porque ahí no manda el pulgar y
            dejar media pantalla vacía no aporta nada.
          */}
          <div className="flex-1 lg:pl-60">
            <main className="mx-auto w-full max-w-[480px] pb-28 lg:max-w-4xl lg:pb-12">
              {children}
            </main>
          </div>

          <NavegacionInferior />
        </ProveedorAvisos>
      </body>
    </html>
  );
}
