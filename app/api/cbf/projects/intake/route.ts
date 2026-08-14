import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "paid_order_required", next: "https://app.homepty.com/my-site" },
    { status: 410 },
  );
}
