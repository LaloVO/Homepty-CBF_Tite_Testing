import { supabase } from "@/lib/supabase";
import type { BucketDeSitio } from "@/lib/site-files";

export type ArchivosVerificados = { ok: true } | { ok: false; status: 400 | 503; error: string };

/**
 * Comprueba que cada archivo exista en su bucket antes de guardar su referencia: un lead o una
 * captación no registra un documento que el navegador no alcanzó a subir.
 */
export async function verificarArchivosSubidos(bucket: BucketDeSitio, rutas: string[]): Promise<ArchivosVerificados> {
  try {
    const resultados = await Promise.all(rutas.map((ruta) => supabase.storage.from(bucket).exists(ruta)));
    const faltante = resultados.findIndex((r) => r.data !== true);
    if (faltante >= 0) {
      const nombre = rutas[faltante].split("/").pop();
      return { ok: false, status: 400, error: `El archivo ${nombre} no se subió: vuelve a adjuntarlo` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[CBF/files] No se pudo verificar archivos en", bucket, error instanceof Error ? error.message : error);
    return { ok: false, status: 503, error: "No se pudieron verificar los archivos adjuntos" };
  }
}
