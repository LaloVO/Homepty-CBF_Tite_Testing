import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { received: false, error: "stripe_webhook_moved", owner: "homepty_new" },
    { status: 410 },
  );
}
