import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, getInventoryUserIds } from "@/lib/auth";
import { esPublicable, proyectarPropiedadPublica } from "@/lib/property-publication";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cbf/posts
 * Devuelve los posts/blogs publicados del hub escritos por el autor del sitio.
 * Cada post con property_id incluye las columnas públicas de la propiedad si está publicada;
 * si no lo está, `property` es `null` (ver lib/property-publication.ts).
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

  const inventoryUserIds = await getInventoryUserIds(authResult);

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const postType = searchParams.get("post_type");

    // La llave del sitio es pública: sólo lo que la Suite publica en el Hub (HPY-132,
    // `homepty_new/src/server/queries/hub-public.ts`): posts con `is_published` y fuera de una
    // comunidad privada. De la propiedad se piden también las columnas de su política de
    // publicación, que no salen.
    let query = supabase
      .from("hub_posts")
      .select(
        `id, title, content, tags, property_id, created_at,
        community:hub_communities!hub_posts_community_id_fkey ( is_private ),
        property:propiedades!hub_posts_property_id_fkey (
          id, nombre, descripcion, precio, moneda, show_prices, area, area_construida,
          habitaciones, banios, estacionamientos, colonia,
          id_tipo_accion, latitud, longitud,
          status, origen_propiedad, aprobacion_status,
          imagenes_propiedades ( image_url )
        )`
      )
      .in("author_id", inventoryUserIds)
      .eq("is_published", true)
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

    // Un post de comunidad privada nunca sale (el embed es LEFT: un post sin comunidad sí sale).
    const visibles = (data ?? []).filter((p) => {
      const community = Array.isArray(p.community) ? p.community[0] : p.community;
      return !community?.is_private;
    });

    const posts = visibles.map((p) => {
      const tags: string[] = p.tags ?? [];
      const isBlog = tags.includes("blog") || tags.includes("articulo");
      const property = Array.isArray(p.property) ? p.property[0] : p.property;
      const publica = property && esPublicable(property) ? proyectarPropiedadPublica(property) : null;
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        tags,
        post_type: isBlog ? "blog" : "post",
        created_at: p.created_at,
        property: publica
          ? {
              ...publica,
              id: String(publica.id),
              imagenes_propiedades: publica.imagenes_propiedades ?? [],
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
