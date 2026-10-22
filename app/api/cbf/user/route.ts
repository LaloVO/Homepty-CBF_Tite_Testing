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
    // La llave del sitio es pública (ver lib/auth.ts): sólo sale lo que el sitio muestra. Del asesor,
    // el nombre, la foto, la actividad y el contacto que publica en su propio sitio; del sitio, su nombre
    // y su tema. Nada interno (Stripe, plan, orden, ciclo de vida, organización, referidos, la llave).

    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("id, nombre_usuario, email_usuario, telefono_usuario, imagen_perfil_usuario, actividad_usuario")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error al obtener usuario:", userError);
      return NextResponse.json(
        { error: "Error al obtener información del usuario" },
        { status: 500 }
      );
    }

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
        user: userData,
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
