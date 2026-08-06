/**
 * Cliente tRPC para conectar el CBF con Homepty Brain
 * 
 * NOTA: Este archivo está preparado para la Fase 2 (integración con Brain).
 * Para el MVP, las funciones están deshabilitadas y retornan null.
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";

const BRAIN_API_URL = process.env.BRAIN_API_URL || "http://localhost:3001/trpc";

const brainHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.HOMEPTY_BRAIN_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
};

/**
 * Cliente tRPC para Homepty Brain
 * Los procedimientos se tipan manualmente (ver interfaces más abajo);
 * el cast a any evita inferencia de DecoratedProcedureRecord del link.
 *
 * method: "GET" — el Brain prod rechaza POST para procedures .query()
 * (405 METHOD_NOT_SUPPORTED); los queries van por GET batch.
 */
export const brainClient = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: BRAIN_API_URL,
      method: "GET",
      headers: brainHeaders,
    }),
  ],
}) as any;

/**
 * Tipos básicos para las respuestas del Brain
 */
export interface PropertyValuation {
  propertyId: number;
  estimatedPrice: number;
  confidence: number;
  factors: {
    location: number;
    size: number;
    amenities: number;
    market: number;
  };
}

export interface MarketAnalysis {
  area: string;
  averagePrice: number;
  pricePerSqm: number;
  trend: "up" | "down" | "stable";
  recommendations: string[];
}

export interface PropertyRecommendation {
  propertyId: number;
  score: number;
  reasons: string[];
}

/**
 * Funciones helper para consumir el Brain desde el CBF
 * NOTA: Deshabilitadas para el MVP - Se activarán en la Fase 2
 */

/**
 * Obtiene la valuación estimada de una propiedad usando ML
 * MVP: Retorna null (funcionalidad de Fase 2)
 */
export async function getPropertyValuation(
  propertyData: {
    area: number;
    habitaciones: number;
    banios: number;
    id_estado: number;
    id_ciudad: number;
    tipo: string;
  }
): Promise<PropertyValuation | null> {
  // TODO: Activar en Fase 2
  console.log("Brain integration not active in MVP");
  return null;
}

/**
 * Obtiene análisis de mercado para una zona específica
 * MVP: Retorna null (funcionalidad de Fase 2)
 */
export async function getMarketAnalysis(
  location: {
    id_estado: number;
    id_ciudad: number;
    colonia?: string;
  }
): Promise<MarketAnalysis | null> {
  // TODO: Activar en Fase 2
  console.log("Brain integration not active in MVP");
  return null;
}

/**
 * Obtiene recomendaciones de propiedades basadas en preferencias
 * MVP: Retorna array vacío (funcionalidad de Fase 2)
 */
export async function getPropertyRecommendations(
  preferences: {
    budget: number;
    area: number;
    habitaciones: number;
    id_estado: number;
  }
): Promise<PropertyRecommendation[]> {
  // TODO: Activar en Fase 2
  console.log("Brain integration not active in MVP");
  return [];
}

/**
 * Obtiene el catálogo de geografía canónico (estados y municipios/ciudades en cascada) desde el Brain
 */
export async function getGeographyCatalog(): Promise<{
  states: { stateCode: string; name: string | null }[];
  municipalities: { cvegeo: string; stateCode: string; name: string | null }[];
} | null> {
  try {
    const response = await fetch(`${BRAIN_API_URL}/spatial.geographyCatalog`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[BrainClient] No se pudo obtener el catálogo de geografía del Brain, HTTP", response.status);
      return null;
    }

    const json = await response.json();
    if (json?.result?.data?.data) {
      return json.result.data.data;
    }
    return null;
  } catch (error) {
    console.error("[BrainClient] Error conectando con el Brain para catálogo geográfico:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo Inteligencia — contrato tRPC real con Homepty Brain (prod ml.homepty.com)
// ─────────────────────────────────────────────────────────────────────────────

export interface BrainValuationRequest {
  lat: number;
  lon: number;
  direccion: string;
  cvegeo?: string;
  radius?: number;
  tipo_inmueble?: number; // 2=Casa Habitación, 3=Casa en Condominio, 4=Departamento en Condominio
  clase_inmueble?: number; // 2=Económica … 8=Única
  vivienda_nueva_usada?: "Nueva" | "Usada";
  habitaciones?: number;
  banos?: number;
  estacionamientos?: number;
  num_pisos?: number;
  superficie_construida?: number;
  tamano_terreno?: number;
  antiguedad_anos?: number;
  estado_conservacion?: "malo" | "regular" | "bueno" | "excelente";
  email?: string;
  nombre?: string;
}

export interface BrainValuationResponse {
  valor_promedio: number | null;
  valor_promedio_m2: number | null;
  inmuebles: Array<{
    clave_avaluo: string;
    fecha_avaluo: string;
    tipo_inmueble: string;
    clase_inmueble: string;
    colonia: string;
    superficie_construida: number;
    superficie_terreno: number;
    recamaras: number;
    banos: number;
    estacionamiento: number;
    distancia_metros: number;
    valor_m2: number;
    valor_final: number;
    antiguedad_anos: number;
    vivienda_nueva_o_usada: string;
    geometria: { lat: number; lon: number };
  }>;
  message: string;
  search_params: Record<string, unknown>;
  data?: {
    mensaje?: string;
    estadisticas?: {
      total_avaluos_encontrados?: number;
      calibracion_mercado?: {
        metodo?: string;
        market_m2?: number;
        listings?: number;
        confianza?: "none" | "low" | "medium" | "high";
      };
    };
  };
  valuation_status?: {
    status: "estimated" | "insufficient_comparables";
    comparableCount: number;
    minComparableCount: number;
    message: string;
    attempts: Array<{
      profile: string;
      radius: number;
      comparableCount: number;
      hasEstimate: boolean;
    }>;
    suggestedNextSteps: string[];
  };
}

const CONFIDENCE_MAP: Record<string, number> = {
  none: 0.2,
  low: 0.4,
  medium: 0.65,
  high: 0.85,
};

/**
 * Estimación de valor con el AVM del Brain (valueweb.estimate).
 * Fallback progresivo 4 intentos: exact → wider_radius → relaxed_features → market_context.
 * Retorna null solo si la conexión falla (no si la zona no tiene comparables).
 */
export async function brainValueEstimate(
  request: BrainValuationRequest
): Promise<BrainValuationResponse | null> {
  try {
    const result = await brainClient.valueweb.estimate.query(request);
    return result as BrainValuationResponse;
  } catch (error) {
    console.error("[BrainClient] Error llamando valueweb.estimate:", error);
    return null;
  }
}

/**
 * Derivar el contrato de interpretación LLM (ai.interpretation.valuation) desde
 * la respuesta del AVM. El rango es ±15% del valor central; la confianza viene
 * de la calibración de mercado (none/low/medium/high → 0.2–0.85).
 */
export function valuationResultForLLM(
  valuation: BrainValuationResponse
): {
  predictedPrice: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
} {
  const confidence =
    CONFIDENCE_MAP[valuation.data?.estadisticas?.calibracion_mercado?.confianza ?? "none"] ?? 0.2;
  const predictedPrice = valuation.valor_promedio ?? 0;
  const margin = predictedPrice * 0.15;
  return {
    predictedPrice,
    confidence,
    lowerBound: Math.max(0, predictedPrice - margin),
    upperBound: predictedPrice + margin,
  };
}

/**
 * Explicación en lenguaje natural de la valuación (ai.interpretation.valuation).
 */
export async function brainInterpretValuation(
  propertyId: string,
  result: {
    predictedPrice: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }
): Promise<{
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  riskFactors: string[];
  opportunities: string[];
  confidence: number;
} | null> {
  try {
    const interpretation = await brainClient.ai.interpretation.valuation.query({
      propertyId,
      result,
    });
    if (
      interpretation &&
      typeof interpretation.summary === "string" &&
      Array.isArray(interpretation.keyInsights)
    ) {
      return interpretation;
    }
    return null;
  } catch (error) {
    console.error("[BrainClient] Error llamando ai.interpretation.valuation:", error);
    return null;
  }
}

