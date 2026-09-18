import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, getInventoryUserIds } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cbf/properties
 * Obtiene las propiedades del usuario autenticado
 * 
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 * 
 * Query params opcionales:
 * - limit: número de resultados (default: 50, max: 100)
 * - offset: offset para paginación (default: 0)
 * - tipo: filtrar por tipo de propiedad
 * - id_tipo_accion: filtrar por tipo de acción (1=Venta, 2=Renta, etc.)
 * - is_unit: filtrar por unidades (true/false)
 * - parent_id: filtrar unidades hijas por desarrollo
 */
export async function GET(request: NextRequest) {
  // Autenticar la solicitud
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Error de autenticación
  }

  const inventoryUserIds = await getInventoryUserIds(authResult);

  try {
    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const tipo = searchParams.get("tipo");
    const idTipoAccion = searchParams.get("id_tipo_accion");
    const isUnit = searchParams.get("is_unit");
    const parentId = searchParams.get("parent_id");

    // Construir query
    let query = supabase
      .from("propiedades")
      .select("*, imagenes_propiedades(*), amenidades_propiedades(*)", { count: "exact" })
      .in("id_usuario", inventoryUserIds)
      .neq("status", "eliminado")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros opcionales
    if (tipo) {
      query = query.eq("tipo", tipo);
    }
    if (idTipoAccion) {
      query = query.eq("id_tipo_accion", parseInt(idTipoAccion));
    }
    if (isUnit !== null) {
      query = query.eq("is_unit", isUnit === "true");
    }
    if (parentId !== null) {
      const parsedParentId = Number(parentId);
      if (!Number.isInteger(parsedParentId) || parsedParentId <= 0) {
        return NextResponse.json({ error: "parent_id inválido" }, { status: 400 });
      }
      query = query.eq("parent_id", parsedParentId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error al obtener propiedades:", error);
      return NextResponse.json(
        { error: "Error al obtener propiedades" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        total: count ?? data?.length ?? 0,
      },
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
