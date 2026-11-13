import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// La llave pública de la Suite: la publicable (`sb_publishable_…`) si está; la anon heredada sólo mientras Supabase siga
// aceptando las llaves heredadas (rotación de la service_role filtrada, 2026-11-13: al terminar se desactivan anon y
// service_role juntas). Las dos tienen el rol `anon` y la misma RLS.
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Create a Supabase client for server-side usage
 * This is used in middleware and API routes
 */
export async function createClient() {
  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error(
      "Missing Supabase environment variables. Check your .env.local file"
    );
  }

  return createSupabaseClient(supabaseUrl, supabasePublicKey);
}
