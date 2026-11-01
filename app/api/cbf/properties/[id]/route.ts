import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, getInventoryUserIds } from "@/lib/auth";
import { conOperacionPublicada } from "@/lib/lead-operation";
import {
  APPROVAL_GATE,
  PUBLIC_STATUS,
  SELECT_PROPIEDAD_PUBLICA,
  proyectarPropiedadPublica,
} from "@/lib/property-publication";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cbf/properties/[id]
 * Obtiene una propiedad publicada por ID, con sus columnas públicas (ver lib/property-publication.ts).
 * Una propiedad no publicada responde 404, igual que una que no existe.
 * 
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 * 
 * Params:
 * - id: ID de la propiedad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Autenticar la solicitud
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Error de autenticación
  }

  const inventoryUserIds = await getInventoryUserIds(authResult);
  const { id } = await params;

  try {
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) {
      return NextResponse.json(
        { error: "ID de propiedad inválido" },
        { status: 400 }
      );
    }

    // Obtener la propiedad publicada con sus imágenes y amenidades
    const { data, error } = await supabase
      .from("propiedades")
      .select(SELECT_PROPIEDAD_PUBLICA)
      .eq("id", propertyId)
      .in("id_usuario", inventoryUserIds)
      .eq("status", PUBLIC_STATUS)
      .or(APPROVAL_GATE)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Propiedad no encontrada" },
          { status: 404 }
        );
      }
      console.error("Error al obtener propiedad:", error);
      return NextResponse.json(
        { error: "Error al obtener la propiedad" },
        { status: 500 }
      );
    }

    // HPY-205 — La operación publicada con su nombre del catálogo (ver /api/cbf/properties).
    const { data: catalogo } = await supabase
      .from("accionespropiedades")
      .select("id:id_accion_propiedad, nombre:nombre_accion_propiedad, codigo:operation_code");

    return NextResponse.json({
      success: true,
      data: conOperacionPublicada([proyectarPropiedadPublica(data)], catalogo || [])[0],
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
