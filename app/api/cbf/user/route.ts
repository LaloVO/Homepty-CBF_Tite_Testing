import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cbf/user
 * Obtiene la información del usuario autenticado y su configuración de sitio
 * 
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 */
export async function GET(request: NextRequest) {
  // Autenticar la solicitud
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Error de autenticación
  }

  const { siteId, userId } = authResult;

  try {
    // La llave del sitio es pública (ver lib/auth.ts): sólo sale lo que el sitio muestra. Del asesor, el
    // perfil que cargó en la Suite, que su sitio muestra siempre (owner, 2026-10-21): nombre, foto, banner,
    // descripción, actividades, servicios, cómo trabaja, teléfono, email y ubicación (estado y ciudad, con
    // su id y su nombre). Ninguna preferencia `mostrar_*_perfil` lo oculta. Del sitio, su nombre y su tema.
    // Nada interno (subject_ref, organización, referidos, términos, onboarding, estado de la cuenta,
    // preferencias, Stripe, plan, orden, ciclo de vida, la llave).

    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("id, nombre_usuario, email_usuario, telefono_usuario, imagen_perfil_usuario, actividad_usuario, banner_usuario, descripcion_usuario, actividades, actividad_claves, servicios, como_trabaja, id_estado, id_ciudad, estados(nombre_estado), ciudades(nombre_ciudad)")
      .eq("id", userId)
      .single()
      // `usuarios` tiene la FK hacia `estados` y `ciudades` (muchos a uno): PostgREST entrega un objeto o
      // null. Sin tipos generados, supabase-js no conoce la relación y los tiparía como arreglos.
      .overrideTypes<{ estados: { nombre_estado: string } | null; ciudades: { nombre_ciudad: string } | null }>();

    if (userError) {
      console.error("Error al obtener usuario:", userError);
      return NextResponse.json(
        { error: "Error al obtener información del usuario" },
        { status: 500 }
      );
    }

    // El estado y la ciudad llegan anidados del catálogo; el sitio recibe su nombre plano, como la tarjeta
    // del perfil en la Suite (`estado`, `ciudad`).
    const { estados, ciudades, ...perfil } = userData;
    const user = { ...perfil, estado: estados?.nombre_estado ?? null, ciudad: ciudades?.nombre_ciudad ?? null };

    // Obtener configuración del sitio
    const { data: siteData, error: siteError } = await supabase
      .from("user_sites")
      .select("site_name, theme_config")
      .eq("id", siteId)
      .single();

    if (siteError && siteError.code !== "PGRST116") {
      console.error("Error al obtener configuración del sitio:", siteError);
      // No es error crítico, continuar sin configuración de sitio
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        site: siteData
          ? {
              ...siteData,
              platform_config: {
                mapbox_token: process.env.MAPBOX_ACCESS_TOKEN ?? null,
              },
            }
          : null,
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
