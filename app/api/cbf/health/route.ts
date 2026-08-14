import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await supabase
    .from("user_sites")
    .select("id")
    .limit(1);

  return NextResponse.json(
    { ok: !error, dependencies: { database: error ? "unavailable" : "available" } },
    { status: error ? 503 : 200 }
  );
}
