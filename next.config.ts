import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, Turbopack busca la raíz hacia arriba y encuentra un
  // package-lock.json del directorio del usuario que no tiene nada que ver.
  turbopack: { root: path.resolve(".") },

  async headers() {
    return [
      {
        // El service worker NUNCA debe servirse desde la caché del navegador:
        // si se queda uno viejo, la app deja de recibir actualizaciones.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
