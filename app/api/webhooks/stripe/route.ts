import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createHmac } from "crypto";
import { supabase } from "@/lib/supabase";
import { deployVercelProject } from "@/lib/vercel";

export const dynamic = "force-dynamic";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

const PLAN_MAP: Record<string, string> = {
  plink_1SgcF0C0v2j6fYqmqgceO2WL: "asesor_starter",
  plink_1SgcH8C0v2j6fYqmtwySsiSp: "asesor_independiente",
  plink_1SgcIsC0v2j6fYqmkMT8gljj: "inmobiliaria",
  plink_1SgcKeC0v2j6fYqmZMBjE8Ef: "inmobiliaria_plus",
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const usuarioId = session.client_reference_id;
  if (!usuarioId) {
    console.error("checkout.session.completed sin client_reference_id:", session.id);
    return;
  }

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const planTipo = session.payment_link ? (PLAN_MAP[session.payment_link as string] ?? session.payment_link) : null;

  const { data: site, error } = await supabase
    .from("user_sites")
    .select("id, subdomain, cbf_api_key, referral_code")
    .eq("user_id_supabase", usuarioId)
    .single();

  if (error || !site) {
    console.error("Sitio no encontrado para usuario:", usuarioId);
    return;
  }

  await supabase
    .from("user_sites")
    .update({
      is_active: true,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan_tipo: planTipo,
    })
    .eq("id", site.id);

  if (site.subdomain) {
    deployVercelProject(site.subdomain, site.cbf_api_key);
  }

  if (site.referral_code && process.env.REFERRAL_WEBHOOK_SECRET) {
    const payload = JSON.stringify({
      stripe_event_id: session.id,
      stripe_amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "mxn",
      referral_code: site.referral_code,
      user_site_id: site.id,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    });
    const sig = createHmac("sha256", process.env.REFERRAL_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.homepty.com";
    fetch(`${appUrl}/api/referrals/conversion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Homepty-Signature": sig },
      body: payload,
    }).catch((err) => console.error("Error notificando conversión de referido:", err));
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret no configurado" }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Falta stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Firma de webhook inválida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.deleted":
      // Sin protocolo de desactivación por ahora — registrar para auditoría
      console.log("Suscripción cancelada:", (event.data.object as Stripe.Subscription).id);
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
