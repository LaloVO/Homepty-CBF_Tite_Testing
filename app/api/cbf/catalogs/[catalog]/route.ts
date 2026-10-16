import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { leerConsultaDeCatalogo } from "@/lib/site-catalogs";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cbf/catalogs/[catalog]
 * Catálogos para los formularios del sitio: `estados`, `ciudades?id_estado=N`, `amenidades`,
 * `tipos-propiedad` y `operaciones`. Ver lib/site-catalogs.ts.
 *
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ catalog: string }> }
) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) return authResult;

  const { catalog } = await params;
  const consulta = leerConsultaDeCatalogo(catalog, new URL(request.url).searchParams);
  if (!consulta.ok) return NextResponse.json({ error: consulta.error }, { status: consulta.status });

  let query = supabase.from(consulta.tabla).select(consulta.columnas).order(consulta.orden);
  if (consulta.idEstado !== undefined) query = query.eq("id_estado", consulta.idEstado);

  const { data, error } = await query;
  if (error) {
    console.error("[CBF/catalogs] Error leyendo", consulta.tabla, error.code);
    return NextResponse.json({ error: "No fue posible cargar el catálogo" }, { status: 503 });
  }
  return NextResponse.json({ success: true, data: data ?? [] });
}
