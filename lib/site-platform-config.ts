/**
 * Configuración pública que CBF entrega a cada sitio en `GET /api/cbf/user` (`site.platform_config`).
 *
 * Sólo viajan valores hechos para el navegador: el token público de Mapbox, y la URL y la llave anon
 * de Supabase, cuyas lecturas y escrituras gobierna la RLS. Con ellos un sitio lee los catálogos
 * públicos, sube documentos y registra captaciones de propietarios sin variables propias ni llaves
 * embebidas en su código. La llave de servicio nunca sale de aquí.
 */
export interface SitePlatformConfig {
  mapbox_token: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
}

export function sitePlatformConfig(env: Record<string, string | undefined> = process.env): SitePlatformConfig {
  return {
    mapbox_token: env.MAPBOX_ACCESS_TOKEN ?? null,
    supabase_url: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabase_anon_key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
  };
}
