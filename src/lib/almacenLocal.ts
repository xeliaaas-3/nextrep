/**
 * Almacén reactivo sobre `localStorage`.
 *
 * Solo guarda preferencias de pantalla (qué ejercicio estaba abierto, si se
 * muestra el RPE, el descanso en curso). Los datos del entrenamiento viven en
 * IndexedDB: aquí nunca va nada que no se pueda perder.
 *
 * Expone una API de suscripción para poder leerlo con `useSyncExternalStore`,
 * que es la forma correcta de conectar React con un sistema externo sin
 * sincronizar estado dentro de un efecto.
 */

const oyentes = new Map<string, Set<() => void>>();

/**
 * Cache de valores ya parseados. `useSyncExternalStore` compara la referencia
 * devuelta por `leer`, así que no podemos parsear el JSON en cada lectura: se
 * generaría un objeto nuevo cada vez y React entraría en un bucle.
 */
const cache = new Map<string, unknown>();

export function suscribir(clave: string, alCambiar: () => void): () => void {
  const conjunto = oyentes.get(clave) ?? new Set();
  conjunto.add(alCambiar);
  oyentes.set(clave, conjunto);

  return () => {
    conjunto.delete(alCambiar);
    if (conjunto.size === 0) oyentes.delete(clave);
  };
}

export function leer<T>(clave: string, inicial: T): T {
  if (cache.has(clave)) return cache.get(clave) as T;

  let valor = inicial;
  try {
    const guardado = window.localStorage.getItem(clave);
    if (guardado !== null) valor = JSON.parse(guardado) as T;
  } catch {
    // Modo privado, almacenamiento bloqueado o JSON corrupto: valor inicial.
  }

  cache.set(clave, valor);
  return valor;
}

export function escribir<T>(clave: string, valor: T): void {
  cache.set(clave, valor);

  try {
    if (valor === null || valor === undefined) window.localStorage.removeItem(clave);
    else window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si no se puede persistir, al menos el valor vive en memoria.
  }

  for (const alCambiar of oyentes.get(clave) ?? []) alCambiar();
}
