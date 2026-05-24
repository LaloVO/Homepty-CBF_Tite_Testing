import { redirect } from "next/navigation";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import SetupWizard from "./SetupWizard";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; usuario?: string }>;
}) {
  const params = await searchParams;

  let usuarioId: string | null = null;

  if (params.session && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(params.session);
      usuarioId = session.client_reference_id ?? null;
    } catch {
      // session inválida — fallback al param directo
    }
  }

  if (!usuarioId && params.usuario) {
    usuarioId = params.usuario;
  }

  if (!usuarioId) {
    redirect("/");
  }

  const { data: user } = await supabase
    .from("usuarios")
    .select("nombre_usuario")
    .eq("id", usuarioId)
    .single();

  const { data: site } = await supabase
    .from("user_sites")
    .select("site_name")
    .eq("user_id_supabase", usuarioId)
    .single();

  if (!site) {
    redirect("/");
  }

  return (
    <SetupWizard
      usuarioId={usuarioId}
      nombreUsuario={user?.nombre_usuario ?? ""}
      siteName={site.site_name}
    />
  );
}
