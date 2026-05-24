import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { deployVercelProject } from "@/lib/vercel";

interface SetupSiteBody {
  usuario_id: string;
  site_name: string;
  tagline: string;
  description: string;
  modules: string[];
  primary_color: string;
  logo_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SetupSiteBody = await request.json();
    const { usuario_id, site_name, tagline, description, modules, primary_color, logo_url } = body;

    if (!usuario_id || !site_name) {
      return NextResponse.json(
        { ok: false, message: "Faltan campos requeridos: usuario_id, site_name" },
        { status: 400 }
      );
    }

    const { data: site, error } = await supabase
      .from("user_sites")
      .select("id, subdomain, cbf_api_key")
      .eq("user_id_supabase", usuario_id)
      .single();

    if (error || !site) {
      return NextResponse.json(
        { ok: false, message: "Sitio no encontrado para este usuario" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("user_sites")
      .update({
        site_name,
        is_active: true,
        theme_config: {
          primaryColor: primary_color,
          secondaryColor: "#10B981",
          fontFamily: "Inter",
          logo: logo_url ?? null,
          modules,
        },
        seo_config: {
          title: site_name,
          description: tagline,
          keywords: [],
        },
      })
      .eq("id", site.id);

    if (updateError) {
      console.error("Error actualizando sitio:", updateError);
      return NextResponse.json(
        { ok: false, message: "Error al activar el sitio" },
        { status: 500 }
      );
    }

    if (site.subdomain) {
      deployVercelProject(site.subdomain, site.cbf_api_key);
    }

    const site_url = site.subdomain ? `https://${site.subdomain}.homepty.com` : null;

    return NextResponse.json({ ok: true, site_url });
  } catch (err) {
    console.error("Error en setup-site:", err);
    return NextResponse.json({ ok: false, message: "Error interno del servidor" }, { status: 500 });
  }
}
