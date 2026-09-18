import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { brainClient } from "@/lib/brain-client";

/**
 * GET /api/cbf/taxonomy
 * Expone el árbol canónico de taxonomía del Brain a sitios CBF autenticados.
 */
export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const result = await brainClient.taxonomy.getTree.query();
    const data = result?.data ?? result;

    return NextResponse.json({
      success: true,
      data,
      source: "homepty-brain",
    });
  } catch (error) {
    console.error("[CBF/taxonomy] Error obteniendo taxonomía del Brain:", error);
    return NextResponse.json(
      { error: "No fue posible obtener la taxonomía inmobiliaria" },
      { status: 502 }
    );
  }
}
