import { NextResponse } from "next/server";
import { hasInternalCredential } from "@/lib/internal-auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!hasInternalCredential(request, "CBF_PROVISION_KEY")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const body = await request.json().catch(() => null) as { approved_by?: string; reason?: string } | null;
  if (!body?.approved_by || !body.reason || body.reason.trim().length < 8) {
    return NextResponse.json({ ok: false, error: "approval_audit_required" }, { status: 400 });
  }
  const { data: order } = await supabase
    .from("site_orders")
    .select("payment_status, fulfillment_status, site_manifest, qa_report")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  if (!["paid", "comped"].includes(order.payment_status) || order.fulfillment_status !== "ready_local") {
    return NextResponse.json({ ok: false, error: "order_not_releasable" }, { status: 409 });
  }
  if (!order.site_manifest || !order.qa_report) {
    return NextResponse.json({ ok: false, error: "release_evidence_required" }, { status: 409 });
  }
  const { error } = await supabase.from("site_orders").update({
    fulfillment_status: "release_approved",
    release_approved_at: new Date().toISOString(),
    release_approved_by: body.approved_by,
    blocked_reason: null,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (error) return NextResponse.json({ ok: false, error: "approval_failed" }, { status: 500 });
  await supabase.from("site_order_events").insert({
    site_order_id: orderId,
    source: "operator",
    event_type: "release.approved",
    payload: { approved_by: body.approved_by, reason: body.reason },
  });
  return NextResponse.json({ ok: true, status: "release_approved" });
}
