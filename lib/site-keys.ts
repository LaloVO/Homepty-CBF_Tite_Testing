import { createHash } from "node:crypto";
import { after } from "next/server";
import { supabase } from "./supabase";

/**
 * Las llaves de los sitios, por su huella (owner, entrada 104, decisión 3: rotarlas «siempre y cuando garantices que no haya efectos
 * colaterales a los sitios satélites»). La Suite guarda en `site_api_keys` el sha256 de cada llave de un sitio, nunca la llave
 * (migración 20261107120000): un sitio puede tener más de una activa mientras su despliegue cambia de la vieja a la nueva, y una llave
 * retirada (`retired_at`, sólo con el paso explícito del runbook) se rechaza como una desconocida. Toda llave que se escribe en
 * `user_sites.cbf_api_key` entra sola como activa (trigger de la Suite), así que el aprovisionamiento y «Regenerar» en /my-site no
 * cambian.
 */
export function huellaDeLlave(llave: string): string {
  return createHash("sha256").update(llave).digest("hex");
}

/** Lo que CBF necesita de una llave y del sitio que nombra. */
export type LlaveDeSitio = {
  id: string;
  retired_at: string | null;
  site: { id: string; user_id_supabase: string; organization_id: string | null; is_active: boolean; lifecycle_status: string | null } | null;
};

/**
 * La llave por su huella, con el sitio que nombra, en UNA consulta (el sitio va embebido por la llave foránea `site_id`). Un rechazo
 * de una llave desconocida o retirada cuesta lo mismo que antes el de una llave desconocida: un viaje a la base.
 */
export async function buscarLlave(llave: string): Promise<{ llave: LlaveDeSitio | null; error: { code?: string } | null }> {
  const { data, error } = await supabase
    .from("site_api_keys")
    .select("id, retired_at, site:user_sites(id, user_id_supabase, organization_id, is_active, lifecycle_status)")
    .eq("key_sha256", huellaDeLlave(llave))
    .maybeSingle();
  return { llave: (data as unknown as LlaveDeSitio | null) ?? null, error };
}

/** A lo más una anotación por llave cada cinco minutos: el runbook mira que el uso de la vieja se detenga, no cuenta peticiones. */
const CADA_MS = 5 * 60 * 1000;

/**
 * Anota, DESPUÉS de responder (`after`, la respuesta no espera ni cambia), que la llave se usó (`last_used_at`) o que se intentó usar
 * ya retirada (`last_refused_at`, para ver un despliegue que se quedó con la vieja). Si la base no contesta sólo se registra el código.
 */
export function anotarUso(llaveId: string, columna: "last_used_at" | "last_refused_at") {
  try {
    after(async () => {
      const ahora = Date.now();
      const { error } = await supabase
        .from("site_api_keys")
        .update({ [columna]: new Date(ahora).toISOString() })
        .eq("id", llaveId)
        .or(`${columna}.is.null,${columna}.lt.${new Date(ahora - CADA_MS).toISOString()}`);
      if (error) console.error("[CBF/llaves] No se pudo anotar el uso de una llave — code:", error.code);
    });
  } catch (error) {
    // Anotar el uso nunca decide si se admite la llave.
    console.error("[CBF/llaves] No se pudo programar la anotación de uso:", (error as Error).message);
  }
}
