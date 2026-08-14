import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "legacy_endpoint_retired", next: "/api/internal/site-orders/:orderId/provision" },
    { status: 410 },
  );
}
