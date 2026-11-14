import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // También las llaves (revisión sec2, SF-8): toda petición de un satélite se admite buscando su llave en `site_api_keys`; si esa tabla no
  // responde (o CBF se desplegó antes de la migración 20261107120000), todos los satélites reciben 401 y la salud tiene que decirlo.
  const [sitios, llaves] = await Promise.all([
    supabase.from("user_sites").select("id").limit(1),
    supabase.from("site_api_keys").select("id").limit(1),
  ]);
  const error = sitios.error ?? llaves.error;

  return NextResponse.json(
    {
      ok: !error,
      dependencies: {
        database: sitios.error ? "unavailable" : "available",
        site_keys: llaves.error ? "unavailable" : "available",
      },
    },
    { status: error ? 503 : 200 }
  );
}
