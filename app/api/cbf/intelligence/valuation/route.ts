import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import {
  brainValueEstimate,
  brainInterpretValuation,
  valuationResultForLLM,
  type BrainValuationRequest,
} from "@/lib/brain-client";
import { trackBrainUsage } from "@/lib/intelligence";

/**
 * POST /api/cbf/intelligence/valuation
 * Módulo Inteligencia — Valuación de inmueble con el AVM del Brain + explicación LLM.
 *
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 *
 * Body (JSON):
 * {
 *   "lat": number, "lon": number, "direccion": string,
 *   "tipo_inmueble"?: number,      // 2=Casa, 3=Casa en Condominio, 4=Departamento
 *   "superficie_construida"?: number,
 *   "tamano_terreno"?: number,
 *   "habitaciones"?: number,
 *   "banos"?: number,
 *   "estacionamientos"?: number,
 *   "vivienda_nueva_usada"?: "Nueva" | "Usada",
 *   "antiguedad_anos"?: number,
 *   "estado_conservacion"?: "malo" | "regular" | "bueno" | "excelente",
 *   "radius"?: number,
 *   "clase_inmueble"?: number,
 *   "cvegeo"?: string
 * }
 *
 * Respuesta:
 * 200 { success: true,  data: { valor, valor_m2, rango:[lo,hi], confidence,
 *                              explanation, comparables, status } }
 * 200 { success: false, code: "INSUFFICIENT_COMPARABLES", suggestedNextSteps }  ← no es error 500
 * 401 auth / 400 validación / 502 Brain inalcanzable
 */
export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const apiKey = request.headers.get("Authorization")?.split(" ")[1] ?? null;
  const userId = authResult.userId;
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido: se esperaba JSON" }, { status: 400 });
  }

  const requiredFields = ["lat", "lon", "direccion"];
  const missingFields = requiredFields.filter((field) => !(field in body));
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Campos requeridos faltantes: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  const requestPayload: BrainValuationRequest = {
    lat: Number(body.lat),
    lon: Number(body.lon),
    direccion: String(body.direccion),
    ...(body.cvegeo ? { cvegeo: String(body.cvegeo) } : {}),
    ...(body.radius !== undefined ? { radius: Number(body.radius) } : {}),
    ...(body.tipo_inmueble !== undefined ? { tipo_inmueble: Number(body.tipo_inmueble) } : {}),
    ...(body.clase_inmueble !== undefined ? { clase_inmueble: Number(body.clase_inmueble) } : {}),
    ...(body.vivienda_nueva_usada ? { vivienda_nueva_usada: String(body.vivienda_nueva_usada) as "Nueva" | "Usada" } : {}),
    ...(body.habitaciones !== undefined ? { habitaciones: Number(body.habitaciones) } : {}),
    ...(body.banos !== undefined ? { banos: Number(body.banos) } : {}),
    ...(body.estacionamientos !== undefined ? { estacionamientos: Number(body.estacionamientos) } : {}),
    ...(body.antiguedad_anos !== undefined ? { antiguedad_anos: Number(body.antiguedad_anos) } : {}),
    ...(body.superficie_construida !== undefined ? { superficie_construida: Number(body.superficie_construida) } : {}),
    ...(body.tamano_terreno !== undefined ? { tamano_terreno: Number(body.tamano_terreno) } : {}),
    ...(body.estado_conservacion ? { estado_conservacion: String(body.estado_conservacion) as "malo" | "regular" | "bueno" | "excelente" } : {}),
  };

  let valuation: Awaited<ReturnType<typeof brainValueEstimate>> | null = null;
  try {
    valuation = await brainValueEstimate(requestPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Intelligence/valuation] Error llamando Brain:", error);
    await trackBrainUsage({
      user_id_supabase: userId,
      cbf_api_key: apiKey,
      brain_endpoint: "valueweb.estimate",
      cost_units: 1,
      status: "brain_unreachable",
      latency_ms: Date.now() - start,
    });
    return NextResponse.json(
      { error: "El Brain no respondió", detail: message },
      { status: 502 }
    );
  }
  const estimateLatency = Date.now() - start;

  if (!valuation) {
    await trackBrainUsage({
      user_id_supabase: userId,
      cbf_api_key: apiKey,
      brain_endpoint: "valueweb.estimate",
      cost_units: 1,
      status: "brain_unreachable",
      latency_ms: estimateLatency,
    });
    return NextResponse.json(
      { error: "El Brain no respondió. Intenta de nuevo en unos segundos." },
      { status: 502 }
    );
  }

  const status = valuation.valuation_status?.status ?? "insufficient_comparables";

  if (status !== "estimated" || !valuation.valor_promedio) {
    await trackBrainUsage({
      user_id_supabase: userId,
      cbf_api_key: apiKey,
      brain_endpoint: "valueweb.estimate",
      cost_units: 1,
      status: "insufficient_comparables",
      latency_ms: estimateLatency,
    });
    return NextResponse.json({
      success: false,
      code: "INSUFFICIENT_COMPARABLES",
      message: valuation.valuation_status?.message ?? "No hay suficientes comparables en la zona.",
      comparableCount: valuation.valuation_status?.comparableCount ?? valuation.inmuebles?.length ?? 0,
      suggestedNextSteps: valuation.valuation_status?.suggestedNextSteps ?? [],
    });
  }

  const llmResult = valuationResultForLLM(valuation);
  const explanation = await brainInterpretValuation(
    `satellite-${userId}`,
    llmResult
  );
  const interpretLatency = Date.now() - start;

  const usageError1 = await trackBrainUsage({
    user_id_supabase: userId,
    cbf_api_key: apiKey,
    brain_endpoint: "valueweb.estimate",
    cost_units: 1,
    status: "ok",
    latency_ms: estimateLatency,
  });
  const usageError2 = await trackBrainUsage({
    user_id_supabase: userId,
    cbf_api_key: apiKey,
    brain_endpoint: "ai.interpretation.valuation",
    cost_units: 1,
    status: explanation ? "ok" : "no_explanation",
    latency_ms: interpretLatency,
  });

  return NextResponse.json({
    success: true,
    data: {
      valor: llmResult.predictedPrice,
      valor_m2: valuation.valor_promedio_m2,
      rango: [llmResult.lowerBound, llmResult.upperBound],
      confidence: llmResult.confidence,
      explanation,
      comparables: valuation.inmuebles.length,
      status,
      search_params: valuation.search_params,
    },
    debug: {
      usageError1: usageError1?.message ?? null,
      usageError2: usageError2?.message ?? null,
    },
  });
}
