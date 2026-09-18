/**
 * Aplicación del tema antes del primer pintado.
 *
 * El tema vive en IndexedDB, que se lee de forma asíncrona. Si se esperase a
 * eso, la app se pintaría primero con el tema por defecto y cambiaría después:
 * un parpadeo en cada carga y, peor, elementos que se montan con el color
 * anterior y se quedan con una transición a medias.
 *
 * Por eso el tema se refleja también en `localStorage`, que sí se lee de forma
 * síncrona, y este script lo aplica en el `<head>`, antes de que el navegador
 * pinte nada.
 */

export const CLAVE_TEMA = "gym:tema";

/** Se inyecta tal cual en un `<script>`; por eso va en una sola expresión. */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA,
)});if(t!=="dark"&&t!=="light")t="dark";document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#0b0a0e":"#edede9");}catch(e){document.documentElement.dataset.theme="dark";}})();`;
