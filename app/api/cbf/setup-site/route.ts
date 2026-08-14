import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "legacy_setup_retired", next: "https://app.homepty.com/my-site" },
    { status: 410 },
  );
}
