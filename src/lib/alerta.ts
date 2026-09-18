/**
 * Avisos del temporizador de descanso: sonido, vibración y notificación.
 *
 * Los tres se lanzan a la vez a propósito. Ninguno es fiable por sí solo con
 * la pantalla apagada (el navegador limita los temporizadores en segundo
 * plano), así que el temporizador se calcula siempre a partir de una marca de
 * tiempo absoluta: aunque el aviso llegue tarde, la cuenta atrás que se ve al
 * volver a la app es la correcta.
 */

let contexto: AudioContext | null = null;

type ConstructorAudio = typeof AudioContext;

function obtenerConstructor(): ConstructorAudio | null {
  if (typeof window === "undefined") return null;
  const ventana = window as Window & { webkitAudioContext?: ConstructorAudio };
  return window.AudioContext ?? ventana.webkitAudioContext ?? null;
}

/**
 * Debe llamarse desde un gesto del usuario (el toque que confirma la serie).
 * Los navegadores móviles no dejan crear ni reanudar audio de otra forma.
 */
export function prepararAudio(): void {
  const Constructor = obtenerConstructor();
  if (!Constructor) return;

  contexto ??= new Constructor();
  if (contexto.state === "suspended") void contexto.resume();
}

/** Tres pitidos cortos. */
export function sonarAlarma(): void {
  if (!contexto || contexto.state !== "running") return;

  const inicio = contexto.currentTime;
  for (let i = 0; i < 3; i++) {
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    const desde = inicio + i * 0.28;

    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(880, desde);
    ganancia.gain.setValueAtTime(0.0001, desde);
    ganancia.gain.exponentialRampToValueAtTime(0.35, desde + 0.02);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, desde + 0.22);

    oscilador.connect(ganancia).connect(contexto.destination);
    oscilador.start(desde);
    oscilador.stop(desde + 0.24);
  }
}

export function vibrar(patron: number | number[] = [220, 90, 220]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(patron);
  } catch {
    // Algunos navegadores lo exponen pero lo bloquean: no es crítico.
  }
}

export function permisoNotificaciones(): NotificationPermission | "no-soportado" {
  if (typeof window === "undefined" || !("Notification" in window)) return "no-soportado";
  return Notification.permission;
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

/**
 * Notifica a través del service worker cuando está disponible, porque es la
 * única vía que sigue funcionando con la app en segundo plano en Android.
 */
export async function notificarDescansoTerminado(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const opciones: NotificationOptions = {
    body: "Toca para volver a la serie.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "descanso",
    silent: false,
  };

  try {
    const registro = await navigator.serviceWorker?.getRegistration();
    if (registro) {
      await registro.showNotification("Descanso terminado", opciones);
      return;
    }
    new Notification("Descanso terminado", opciones);
  } catch {
    // Sin notificación seguimos teniendo sonido y vibración.
  }
}

/** Mantiene la pantalla encendida mientras dura el entrenamiento, si se puede. */
export async function mantenerPantallaEncendida(): Promise<WakeLockSentinel | null> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return null;
  try {
    return await navigator.wakeLock.request("screen");
  } catch {
    return null;
  }
}
