import { NextResponse } from "next/server";
import { hasInternalCredential } from "@/lib/internal-auth";
import { supabase } from "@/lib/supabase";

const ALLOWED = new Set(["designing", "ready_local", "blocked"]);
const TRANSITIONS: Record<string, string[]> = {
  ready_for_factory: ["designing", "blocked"],
  designing: ["ready_local", "blocked"],
  ready_local: ["blocked"],
  blocked: ["designing"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!hasInternalCredential(request, "CBF_FACTORY_STATUS_KEY")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const body = await request.json().catch(() => null) as {
    status?: string;
    factory_slug?: string;
    site_manifest?: Record<string, unknown>;
    qa_report?: Record<string, unknown>;
    reason?: string;
  } | null;
  if (!body?.status || !ALLOWED.has(body.status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("site_orders")
    .select("payment_status, fulfillment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  if (!["paid", "comped"].includes(order.payment_status)) {
    return NextResponse.json({ ok: false, error: "order_not_paid" }, { status: 409 });
  }
  if (!TRANSITIONS[order.fulfillment_status]?.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "invalid_transition" }, { status: 409 });
  }
  if (body.status === "ready_local" && (!body.site_manifest || !body.qa_report || !body.factory_slug)) {
    return NextResponse.json({ ok: false, error: "release_evidence_required" }, { status: 400 });
  }

  const patch = {
    fulfillment_status: body.status,
    factory_slug: body.factory_slug,
    site_manifest: body.site_manifest,
    qa_report: body.qa_report,
    blocked_reason: body.status === "blocked" ? body.reason ?? "factory_blocked" : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("site_orders").update(patch).eq("id", orderId);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  await supabase.from("site_order_events").insert({
    site_order_id: orderId,
    source: "factory",
    event_type: `factory.${body.status}`,
    payload: { factory_slug: body.factory_slug ?? null, reason: body.reason ?? null },
  });
  return NextResponse.json({ ok: true, status: body.status });
}
