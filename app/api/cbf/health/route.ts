import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NO_URL";
  const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon";
  
  const { data, error } = await supabase
    .from("user_sites")
    .select("cbf_api_key")
    .limit(1);

  return NextResponse.json({
    supabase_url: url.slice(0, 50),
    key_type: keyType,
    can_read_user_sites: !error,
    row_count: data?.length ?? 0,
    error: error?.message ?? null,
  });
}
