/**
 * Genera la marca de NextRep: dos arcos que se persiguen alrededor de una
 * mancuerna. El mismo cálculo produce los PNG del icono y las rutas SVG del
 * componente de React, así que las dos versiones no pueden desalinearse.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SALIDA = process.argv[2];
mkdirSync(SALIDA, { recursive: true });

const PURPURA = [0x90, 0x13, 0xe8];
const HUESO = [0xed, 0xed, 0xe9];
const NEGRO = [0x0b, 0x0a, 0x0e];
const SUPER = 4;

// Geometría en fracciones del lienzo (centro 0.5, 0.5).
const RO = 0.4; // radio exterior del anillo
const RI = 0.29; // radio interior
const RM = (RO + RI) / 2;
const HUECO = 12; // grados de separación entre los dos arcos
// La cabeza de flecha se construye con el vector tangente al arco, no con
// más grados de barrido: así sale un triángulo isósceles limpio y no una cuña.
const LARGO_PUNTA = 0.13; // hacia delante, en fracciones del lienzo
const ANCHO_PUNTA = 0.095; // a cada lado, radialmente

// El arco púrpura sube por la izquierda y corona arriba; el hueso cierra el
// ciclo por abajo y la derecha. Están a 180°, como en el logo.
const ARCOS = [
  { color: PURPURA, desde: 60, hasta: 232 },
  { color: HUESO, desde: 240, hasta: 412 },
];

const rad = (g) => (g * Math.PI) / 180;

function crearLienzo(n) {
  return { n, datos: new Uint8Array(n * n * 4) };
}

function pintar(lienzo, x, y, color) {
  const i = (y * lienzo.n + x) * 4;
  lienzo.datos[i] = color[0];
  lienzo.datos[i + 1] = color[1];
  lienzo.datos[i + 2] = color[2];
  lienzo.datos[i + 3] = 255;
}

function rectRedondeado(lienzo, x0, y0, x1, y1, r, color) {
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(lienzo.n, Math.ceil(y1)); y++) {
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(lienzo.n, Math.ceil(x1)); x++) {
      const cx = Math.min(Math.max(x, x0 + r), x1 - r);
      const cy = Math.min(Math.max(y, y0 + r), y1 - r);
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) pintar(lienzo, x, y, color);
    }
  }
}

/** Sector de corona circular, con los ángulos en grados de pantalla. */
function arco(lienzo, cx, cy, ri, ro, desde, hasta, color) {
  for (let y = 0; y < lienzo.n; y++) {
    for (let x = 0; x < lienzo.n; x++) {
      const dx = x - cx;
      const dy = cy - y; // el eje Y de la pantalla va al revés
      const r = Math.hypot(dx, dy);
      if (r < ri || r > ro) continue;

      let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      while (ang < desde) ang += 360;
      if (ang <= hasta) pintar(lienzo, x, y, color);
    }
  }
}

function triangulo(lienzo, [ax, ay], [bx, by], [cx2, cy2], color) {
  const signo = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx2)));
  const maxX = Math.min(lienzo.n, Math.ceil(Math.max(ax, bx, cx2)));
  const minY = Math.max(0, Math.floor(Math.min(ay, by, cy2)));
  const maxY = Math.min(lienzo.n, Math.ceil(Math.max(ay, by, cy2)));

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const p = [x, y];
      const d1 = signo(p, [ax, ay], [bx, by]);
      const d2 = signo(p, [bx, by], [cx2, cy2]);
      const d3 = signo(p, [cx2, cy2], [ax, ay]);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) pintar(lienzo, x, y, color);
    }
  }
}

/** Punto en coordenadas de pantalla a partir de radio y ángulo. */
const punto = (cx, cy, r, grados) => [
  cx + r * Math.cos(rad(grados)),
  cy - r * Math.sin(rad(grados)),
];

/**
 * Triángulo isósceles apoyado en el arco: la punta sigue la tangente (sentido
 * de avance) y la base se abre en la dirección radial.
 */
function puntaDeFlecha(cx, cy, rm, grados, largo, ancho) {
  const a = rad(grados);
  const [px, py] = punto(cx, cy, rm, grados);
  // Tangente en sentido de ángulo creciente y radio hacia fuera.
  const tx = -Math.sin(a), ty = -Math.cos(a);
  const rx = Math.cos(a), ry = -Math.sin(a);

  return [
    [px + tx * largo, py + ty * largo],
    [px + rx * ancho, py + ry * ancho],
    [px - rx * ancho, py - ry * ancho],
  ];
}

function reducir(grande, n) {
  const pequeno = crearLienzo(n);
  const f = grande.n / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < f; sy++) {
        for (let sx = 0; sx < f; sx++) {
          const i = ((y * f + sy) * grande.n + (x * f + sx)) * 4;
          r += grande.datos[i]; g += grande.datos[i + 1];
          b += grande.datos[i + 2]; a += grande.datos[i + 3];
        }
      }
      const t = f * f;
      const i = (y * n + x) * 4;
      pequeno.datos[i] = Math.round(r / t);
      pequeno.datos[i + 1] = Math.round(g / t);
      pequeno.datos[i + 2] = Math.round(b / t);
      pequeno.datos[i + 3] = Math.round(a / t);
    }
  }
  return pequeno;
}

function dibujarMarca(n, { maskable = false } = {}) {
  const N = n * SUPER;
  const lienzo = crearLienzo(N);
  const escala = maskable ? 0.74 : 1;
  const c = N / 2;
  const u = (v) => v * N * escala;

  if (maskable) rectRedondeado(lienzo, 0, 0, N, N, 0, NEGRO);
  else rectRedondeado(lienzo, 0, 0, N, N, N * 0.22, NEGRO);

  for (const { color, desde, hasta } of ARCOS) {
    arco(lienzo, c, c, u(RI), u(RO), desde + HUECO / 2, hasta - HUECO / 2, color);

    // Cabeza de flecha en el extremo del arco, apuntando hacia donde avanza.
    const fin = hasta - HUECO / 2;
    triangulo(lienzo, ...puntaDeFlecha(c, c, u(RM), fin, u(LARGO_PUNTA), u(ANCHO_PUNTA)), color);
  }

  // Mancuerna centrada dentro del anillo.
  const alto = (h) => [c - u(h) / 2, c + u(h) / 2];
  const [by0, by1] = alto(0.05);
  rectRedondeado(lienzo, c - u(0.1), by0, c + u(0.1), by1, u(0.015), HUESO);

  const [iy0, iy1] = alto(0.2);
  rectRedondeado(lienzo, c - u(0.155), iy0, c - u(0.1), iy1, u(0.018), HUESO);
  rectRedondeado(lienzo, c + u(0.1), iy0, c + u(0.155), iy1, u(0.018), HUESO);

  const [oy0, oy1] = alto(0.125);
  rectRedondeado(lienzo, c - u(0.205), oy0, c - u(0.163), oy1, u(0.015), HUESO);
  rectRedondeado(lienzo, c + u(0.163), oy0, c + u(0.205), oy1, u(0.015), HUESO);

  return reducir(lienzo, n);
}

// --- PNG ---

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (b) => {
  let c = 0xffffffff;
  for (const byte of b) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

function aPng({ n, datos }) {
  const bruto = Buffer.alloc((n * 4 + 1) * n);
  for (let y = 0; y < n; y++) {
    bruto[y * (n * 4 + 1)] = 0;
    Buffer.from(datos.buffer, y * n * 4, n * 4).copy(bruto, y * (n * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0);
  ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", ihdr),
    trozo("IDAT", deflateSync(bruto, { level: 9 })),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}

for (const tamano of [192, 512]) {
  const png = aPng(dibujarMarca(tamano));
  writeFileSync(join(SALIDA, `icon-${tamano}.png`), png);
  console.log(`icon-${tamano}.png  ${png.length} bytes`);
}
const mask = aPng(dibujarMarca(512, { maskable: true }));
writeFileSync(join(SALIDA, "icon-maskable-512.png"), mask);
console.log(`icon-maskable-512.png  ${mask.length} bytes`);

// --- Rutas SVG equivalentes, para el componente de React (viewBox 0 0 100 100) ---

const n2 = (v) => Math.round(v * 100) / 100;

function rutaArco(desde, hasta) {
  const c = 50;
  const ro = RO * 100;
  const ri = RI * 100;
  const rm = RM * 100;
  const d0 = desde + HUECO / 2;
  const d1 = hasta - HUECO / 2;
  const grande = d1 - d0 > 180 ? 1 : 0;

  const [x1, y1] = punto(c, c, ro, d0);
  const [x2, y2] = punto(c, c, ro, d1);
  const [x3, y3] = punto(c, c, ri, d1);
  const [x4, y4] = punto(c, c, ri, d0);

  const anillo =
    `M${n2(x1)} ${n2(y1)} A${ro} ${ro} 0 ${grande} 0 ${n2(x2)} ${n2(y2)} ` +
    `L${n2(x3)} ${n2(y3)} A${ri} ${ri} 0 ${grande} 1 ${n2(x4)} ${n2(y4)} Z`;

  const [[ax, ay], [bx, by], [cx, cy]] = puntaDeFlecha(
    c, c, rm, d1, LARGO_PUNTA * 100, ANCHO_PUNTA * 100,
  );
  const flecha = `M${n2(ax)} ${n2(ay)} L${n2(bx)} ${n2(by)} L${n2(cx)} ${n2(cy)} Z`;

  return `${anillo} ${flecha}`;
}

console.log("\n--- rutas SVG (viewBox 0 0 100 100) ---");
console.log("púrpura:", rutaArco(ARCOS[0].desde, ARCOS[0].hasta));
console.log("hueso:  ", rutaArco(ARCOS[1].desde, ARCOS[1].hasta));
