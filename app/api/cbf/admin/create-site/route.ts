import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { deployVercelProject } from "@/lib/vercel";

function generateCBFApiKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `cbf_live_${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.CBF_ADMIN_API_KEY;

    if (!authHeader || !authHeader.startsWith("Bearer ") || !adminKey) {
      return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
    }

    if (authHeader.substring(7) !== adminKey) {
      return NextResponse.json({ ok: false, message: "API Key inválida" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id_supabase, site_name, subdomain, custom_domain } = body;

    if (!user_id_supabase || !site_name) {
      return NextResponse.json(
        { ok: false, message: "Faltan campos requeridos: user_id_supabase, site_name" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("id, nombre_usuario")
      .eq("id", user_id_supabase)
      .single();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar si ya tiene sitio (creado previamente por la Suite)
    const { data: existingSite } = await supabase
      .from("user_sites")
      .select("id, cbf_api_key, subdomain")
      .eq("user_id_supabase", user_id_supabase)
      .single();

    let cbfApiKey: string;
    let siteId: string;
    let siteSubdomain = subdomain;

    if (existingSite) {
      // Sitio ya existe — usar key existente y solo hacer deploy
      cbfApiKey = existingSite.cbf_api_key;
      siteId = existingSite.id;
      siteSubdomain = existingSite.subdomain || subdomain;
    } else {
      // Crear sitio nuevo
      cbfApiKey = generateCBFApiKey();

      const { data: newSite, error: createError } = await supabase
        .from("user_sites")
        .insert({
          user_id_supabase,
          site_name,
          subdomain,
          custom_domain,
          cbf_api_key: cbfApiKey,
          is_active: true,
          theme_config: {
            primaryColor: "#3B82F6",
            secondaryColor: "#10B981",
            fontFamily: "Inter",
          },
          seo_config: {
            title: site_name,
            description: `Sitio web de ${user.nombre_usuario}`,
          },
        })
        .select()
        .single();

      if (createError || !newSite) {
        console.error("Error al crear sitio:", createError);
        return NextResponse.json({ ok: false, message: "Error al crear el sitio" }, { status: 500 });
      }

      siteId = newSite.id;
    }

    // Deploy a Vercel (fire-and-forget — fallo no bloquea la respuesta)
    if (siteSubdomain) {
      deployVercelProject(siteSubdomain, cbfApiKey);
    }

    const siteUrl = custom_domain
      ? `https://${custom_domain}`
      : siteSubdomain
      ? `https://${siteSubdomain}.homepty.com`
      : null;

    return NextResponse.json({
      ok: true,
      message: existingSite ? "Sitio existente — deploy iniciado" : "Sitio creado y deploy iniciado",
      data: {
        site_id: siteId,
        user_name: user.nombre_usuario,
        site_name,
        cbf_api_key: cbfApiKey,
        site_url: siteUrl,
      },
    });
  } catch (error) {
    console.error("Error en create-site:", error);
    return NextResponse.json({ ok: false, message: "Error interno del servidor" }, { status: 500 });
  }
}
