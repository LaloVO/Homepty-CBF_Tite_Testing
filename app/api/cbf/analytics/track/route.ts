import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sitioDeCuentaViva } from "@/lib/site-owner";
import { anotarUso, buscarLlave, llaveRetirada } from "@/lib/site-keys";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? "";
  const path = searchParams.get("path") ?? "/";
  const referrer = searchParams.get("ref") || null;
  const screenW = parseInt(searchParams.get("sw") ?? "0") || null;

  // Silently ignore invalid/missing keys without exposing errors to the client
  if (!key.startsWith("cbf_live_") || key.startsWith("cbf_live_PENDING")) {
    return new NextResponse(null, { status: 200 });
  }

  // La llave por su huella, con su sitio (lib/site-keys.ts). Una retirada (o cuyo retiro programado ya llegó) cuenta como desconocida:
  // su visita no se registra.
  const { llave } = await buscarLlave(key);
  const retirada = llave !== null && llaveRetirada(llave.retired_at);
  const site = llave && !retirada ? llave.site : null;
  if (llave && retirada) anotarUso(llave.id, "last_refused_at");
  // track.js lleva su propia copia de la llave (data-key): su uso cuenta para saber cuándo una llave vieja dejó de usarse, también si la
  // visita no se registra (sitio apagado o de una cuenta eliminada; revisión sec2, SF-8).
  if (llave && !retirada) anotarUso(llave.id, "last_used_at");

  // HPY-216: la visita al sitio de una cuenta eliminada no se registra, igual que la de una llave desconocida. La cuenta se pregunta
  // también para un sitio apagado: no registrar una visita tarda lo mismo con el sitio apagado que con su cuenta eliminada.
  const cuentaViva = site ? await sitioDeCuentaViva(site.user_id_supabase) : false;
  if (!site || !site.is_active || !cuentaViva) {
    return new NextResponse(null, { status: 200 });
  }

  const country = request.headers.get("x-vercel-ip-country") ?? null;
  const city = request.headers.get("x-vercel-ip-city") ?? null;

  await supabase.from("analytics_events").insert({
    site_id: site.id,
    path,
    referrer,
    screen_w: screenW,
    country,
    city,
  });

  return new NextResponse(null, { status: 200 });
}
