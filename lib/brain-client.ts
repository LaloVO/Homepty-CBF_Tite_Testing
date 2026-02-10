/**
 * Cliente tRPC para conectar el CBF con Homepty Brain
 * 
 * Este cliente permite al CBF consumir los routers de Homepty Brain:
 * - aiRouter: Servicios de IA (recomendaciones, análisis de texto)
 * - mlRouter: Modelos de ML (predicción de precios, valuación)
 * - analysisRouter: Análisis de mercado
 * - spatialRouter: Análisis espacial y geográfico
 * - financialRouter: Análisis financiero y ROI
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";

// Importar los tipos del Brain (estos deben estar sincronizados)
// Por ahora, definiremos tipos básicos aquí

const BRAIN_API_URL = process.env.BRAIN_API_URL || "http://localhost:3001/trpc";

/**
 * Cliente tRPC para Homepty Brain
 * Nota: Este es un cliente básico. En producción, deberías usar los tipos
 * generados desde el servidor Brain para type-safety completo.
 */
export const brainClient = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: BRAIN_API_URL,
      headers() {
        return {
          // Aquí podrías agregar autenticación si el Brain lo requiere
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
 */

/**
 * Obtiene la valuación estimada de una propiedad usando ML
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
  try {
    const result = await brainClient.ml.predictPrice.query(propertyData);
    return result as PropertyValuation;
  } catch (error) {
    console.error("Error al obtener valuación del Brain:", error);
    return null;
  }
}

/**
 * Obtiene análisis de mercado para una zona específica
 */
export async function getMarketAnalysis(
  location: {
    id_estado: number;
    id_ciudad: number;
    colonia?: string;
  }
): Promise<MarketAnalysis | null> {
  try {
    const result = await brainClient.analysis.marketAnalysis.query(location);
    return result as MarketAnalysis;
  } catch (error) {
    console.error("Error al obtener análisis de mercado del Brain:", error);
    return null;
  }
}

/**
 * Obtiene recomendaciones de propiedades basadas en preferencias
 */
export async function getPropertyRecommendations(
  preferences: {
    budget: number;
    area: number;
    habitaciones: number;
    id_estado: number;
  }
): Promise<PropertyRecommendation[]> {
  try {
    const result = await brainClient.ai.recommendProperties.query(preferences);
    return result as PropertyRecommendation[];
  } catch (error) {
    console.error("Error al obtener recomendaciones del Brain:", error);
    return [];
  }
}

/**
 * Obtiene análisis de ROI para una propiedad de inversión
 */
export async function getROIAnalysis(
  propertyData: {
    precio: number;
    area: number;
    tipo: string;
    id_ciudad: number;
  }
): Promise<any> {
  try {
    const result = await brainClient.financial.calculateROI.query(propertyData);
    return result;
  } catch (error) {
    console.error("Error al obtener análisis de ROI del Brain:", error);
    return null;
  }
}
