import { NextResponse } from "next/server";
import { hasInternalCredential } from "@/lib/internal-auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!hasInternalCredential(request, "CBF_FACTORY_READ_KEY")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const { data: order, error } = await supabase
    .from("site_orders")
    .select(`
      id, purchaser_user_id, subject_type, subject_id, requested_organization_name,
      required_plan_id, amount_mxn_cents, currency, visual_reference_slugs,
      payment_status, fulfillment_status, factory_slug, created_at,
      site_setup_offers (id, version, price_mxn_cents),
      project_intakes (
        id, project_type, company_name, website, instagram, logo_url, brand_colors,
        reference_urls, business_info, vision_brief, source, created_at
      )
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  if (!order) return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  if (!["paid", "comped"].includes(order.payment_status)) {
    return NextResponse.json({ ok: false, error: "order_not_paid" }, { status: 409 });
  }
  if (!order.project_intakes || !["ready_for_factory", "designing"].includes(order.fulfillment_status)) {
    return NextResponse.json({ ok: false, error: "order_not_ready_for_factory" }, { status: 409 });
  }

  return NextResponse.json({
    schema_version: "1.0",
    order: {
      id: order.id,
      purchaser_user_id: order.purchaser_user_id,
      subject: { type: order.subject_type, id: order.subject_id },
      requested_organization_name: order.requested_organization_name,
      required_plan_id: order.required_plan_id,
      visual_reference_slugs: order.visual_reference_slugs ?? [],
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      factory_slug: order.factory_slug,
      created_at: order.created_at,
    },
    intake: order.project_intakes,
    offer: order.site_setup_offers,
    provenance: {
      source: "homepty_new",
      imported_via: "homepty-cbf",
      references_are_inspiration_only: true,
      code_reuse_allowed: false,
    },
  });
}
