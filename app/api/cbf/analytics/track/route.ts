import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  const { data: site } = await supabase
    .from("user_sites")
    .select("id, is_active")
    .eq("cbf_api_key", key)
    .single();

  if (!site || !site.is_active) {
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
