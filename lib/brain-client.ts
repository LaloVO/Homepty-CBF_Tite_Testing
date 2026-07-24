/**
 * Cliente tRPC para conectar el CBF con Homepty Brain
 * 
 * NOTA: Este archivo está preparado para la Fase 2 (integración con Brain).
 * Para el MVP, las funciones están deshabilitadas y retornan null.
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";

const BRAIN_API_URL = process.env.BRAIN_API_URL || "http://localhost:3001/trpc";

/**
 * Cliente tRPC para Homepty Brain
 * Deshabilitado temporalmente para el MVP
 */
export const brainClient = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: BRAIN_API_URL,
      headers() {
        return {
          "Content-Type": "application/json",
        };
      },
    }),
  ],
});

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

