import type { UUID } from "./types";

/**
 * Identidad del usuario.
 *
 * Este modulo es el UNICO punto de la aplicacion que cambia al pasar a la
 * Fase 2. Hoy devuelve siempre la constante local; manana devolvera el id de
 * la sesion de Supabase. Ningun otro archivo debe averiguar quien es el
 * usuario por su cuenta.
 */

/**
 * Usuario unico de la Fase 1. Es un UUID fijo y no aleatorio para que los
 * datos sobrevivan a un borrado de la base local y para poder reasignarlo de
 * una sola pasada cuando el usuario cree su cuenta real.
 */
export const LOCAL_USER_ID: UUID = "00000000-0000-4000-8000-000000000001";

export function getCurrentUserId(): UUID {
  // Fase 2: return supabase.auth.getUser()?.id ?? LOCAL_USER_ID;
  return LOCAL_USER_ID;
}
