import { supabase } from "./supabase";

/**
 * HPY-216 (owner, entradas 92 y 102): las cuentas respetan el estatuto de borrado, y lo que se muestra se deriva de su estado. Una
 * cuenta está eliminada desde su día 0 (`programada`) y para siempre después de su día 90 (`anonimizada`): lo dice la base de la
 * Suite (`usuario_eliminado`, migración 20261105100000, que sólo el cliente de servicio puede llamar). Restaurar la cuenta borra su
 * fila de `cuentas_en_eliminacion` y su sitio vuelve tal cual: aquí nada se escribe.
 *
 * Lanza si la base no responde. `sitioDeCuentaViva` es lo que usan quienes admiten o pintan un sitio: sin saberlo, el sitio no se
 * sirve (falla cerrado, como el contrato heredado en lib/auth.ts).
 */
export async function cuentaDelSitioEliminada(ownerId: string | null | undefined): Promise<boolean> {
  if (!ownerId) return false;
  const { data, error } = await supabase.rpc("usuario_eliminado", { p_user: ownerId });
  if (error) throw new Error(`usuario_eliminado: ${error.code ?? "sin código"}`);
  return data === true;
}

/** Si el sitio de esta cuenta se puede servir: su cuenta no está eliminada y la base lo pudo decir. */
export async function sitioDeCuentaViva(ownerId: string | null | undefined): Promise<boolean> {
  try {
    return !(await cuentaDelSitioEliminada(ownerId));
  } catch (error) {
    console.error("No se pudo saber si la cuenta del sitio está eliminada:", (error as Error).message);
    return false;
  }
}
