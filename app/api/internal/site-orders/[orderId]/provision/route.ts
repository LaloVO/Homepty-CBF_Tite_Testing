import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { hasInternalCredential } from "@/lib/internal-auth";
import { supabase } from "@/lib/supabase";

function generateCbfApiKey() {
  return `cbf_live_${randomBytes(32).toString("base64url")}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!hasInternalCredential(request, "CBF_PROVISION_KEY")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const { data: order } = await supabase
    .from("site_orders")
    .select("*, project_intakes(company_name, vision_brief)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  if (!["paid", "comped"].includes(order.payment_status)) {
    return NextResponse.json({ ok: false, error: "order_not_paid" }, { status: 409 });
  }
  if (!["release_approved", "provisioning"].includes(order.fulfillment_status) || !order.site_manifest || !order.qa_report) {
    return NextResponse.json({ ok: false, error: "release_not_approved" }, { status: 409 });
  }
  if (order.user_site_id) {
    const { data: existing } = await supabase
      .from("user_sites")
      .select("id, cbf_api_key")
      .eq("id", order.user_site_id)
      .maybeSingle();
    return NextResponse.json({
      ok: true,
      site_id: order.user_site_id,
      status: "active",
      cbf_api_key: existing?.cbf_api_key ?? null,
      idempotent: true,
    });
  }
  if (!order.subject_id || !order.factory_slug) {
    return NextResponse.json({ ok: false, error: "order_subject_or_slug_missing" }, { status: 409 });
  }

  const apiKey = generateCbfApiKey();
  const ownerId = order.purchaser_user_id;
  const organizationId = order.subject_type === "organization" ? order.subject_id : null;
  if (order.fulfillment_status === "release_approved") {
    const { error: transitionError } = await supabase.from("site_orders").update({
      fulfillment_status: "provisioning",
      blocked_reason: null,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id).eq("fulfillment_status", "release_approved");
    if (transitionError) {
      return NextResponse.json({ ok: false, error: "provision_transition_failed" }, { status: 500 });
    }
    await supabase.from("site_order_events").insert({
      site_order_id: order.id,
      source: "cbf",
      event_type: "site.provisioning",
      payload: {},
    });
  }
  const { data: site, error } = await supabase.from("user_sites").insert({
    user_id_supabase: ownerId,
    organization_id: organizationId,
    site_order_id: order.id,
    factory_slug: order.factory_slug,
    site_name: order.project_intakes?.company_name ?? order.factory_slug,
    subdomain: order.factory_slug,
    cbf_api_key: apiKey,
    is_active: true,
    lifecycle_status: "active",
    platform_config: { product_shell: order.site_manifest?.product_shell ?? null, order_id: order.id },
    theme_config: {},
    seo_config: { title: order.project_intakes?.company_name ?? order.factory_slug, description: order.project_intakes?.vision_brief ?? null },
  }).select("id").single();
  if (error || !site) {
    const { data: existing } = await supabase.from("user_sites").select("id, cbf_api_key").eq("site_order_id", order.id).maybeSingle();
    if (existing) {
      await supabase.from("site_orders").update({
        user_site_id: existing.id,
        fulfillment_status: "active",
        blocked_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);
      return NextResponse.json({
        ok: true,
        site_id: existing.id,
        status: "active",
        cbf_api_key: existing.cbf_api_key,
        idempotent: true,
      });
    }
    await supabase.from("site_orders").update({
      fulfillment_status: "blocked",
      blocked_reason: "site_creation_failed",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    return NextResponse.json({ ok: false, error: "site_creation_failed" }, { status: 500 });
  }

  const sources = new Map<string, "owner" | "managed_agent" | "authorized_member">([[ownerId, "owner"]]);
  if (organizationId) {
    const [{ data: managed }, { data: members }] = await Promise.all([
      supabase.from("usuarios").select("id").eq("managed_by_org_id", organizationId),
      supabase.from("organization_members").select("user_id, role").eq("organization_id", organizationId),
    ]);
    for (const user of managed ?? []) sources.set(user.id, "managed_agent");
    for (const member of members ?? []) if (!sources.has(member.user_id)) sources.set(member.user_id, "authorized_member");
  }
  await supabase.from("site_inventory_sources").upsert(
    [...sources].map(([user_id, source_type]) => ({ site_id: site.id, user_id, source_type, enabled: true })),
    { onConflict: "site_id,user_id" },
  );
  await supabase.from("site_orders").update({
    user_site_id: site.id,
    fulfillment_status: "active",
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  await supabase.from("site_order_events").insert({
    site_order_id: order.id,
    source: "cbf",
    event_type: "site.provisioned",
    payload: { site_id: site.id },
  });

  // No deployment occurs here. The one-time API key is returned only to the
  // separately authorized provision caller that will configure the released frontend.
  return NextResponse.json({ ok: true, site_id: site.id, status: "active", cbf_api_key: apiKey });
}
