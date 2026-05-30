import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cbf/posts
 * Devuelve los posts/blogs del hub escritos por el autor del sitio.
 * Cada post con property_id incluye los datos completos de la propiedad.
 *
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 *
 * Query params opcionales:
 * - post_type: "post" | "blog"  (filtra por tipo)
 * - limit: número de resultados (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const postType = searchParams.get("post_type");

    let query = supabase
      .from("hub_posts")
      .select(
        `id, title, content, tags, property_id, created_at,
        property:propiedades!hub_posts_property_id_fkey (
          id, nombre, descripcion, precio, moneda, area, area_construida,
          habitaciones, banios, estacionamientos, direccion, colonia,
          id_tipo_accion, latitud, longitud,
          imagenes_propiedades ( image_url )
        )`
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (postType === "blog") {
      query = query.contains("tags", ["blog"]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener posts del hub:", error);
      return NextResponse.json(
        { error: "Error al obtener posts" },
        { status: 500 }
      );
    }

    const posts = (data ?? []).map((p: any) => {
      const tags: string[] = p.tags ?? [];
      const isBlog = tags.includes("blog") || tags.includes("articulo");
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        tags,
        post_type: isBlog ? "blog" : "post",
        created_at: p.created_at,
        property: p.property
          ? {
              ...p.property,
              id: String(p.property.id),
              imagenes_propiedades: p.property.imagenes_propiedades ?? [],
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("Error inesperado en /api/cbf/posts:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
