import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createProjectIntake } from "@/lib/db";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot check
    if (body._honey || body.website_confirm) {
      return NextResponse.json({ success: true }, { status: 200, headers: CORS });
    }

    const { contact, template_slug } = body;

    // Minimal validation
    if (!contact?.email || !contact?.name || !contact?.phone) {
      return NextResponse.json(
        { error: "Faltan datos de contacto obligatorios (name, email, phone)" },
        { status: 400, headers: CORS }
      );
    }

    const payload = {
      template_slug: template_slug ?? null,
      project_type: body.project_type ?? null,
      company_name: body.company_name ?? null,
      website: body.website ?? null,
      instagram: body.instagram ?? null,
      logo_url: body.logo_url ?? null,
      brand_colors: Array.isArray(body.brand_colors) ? body.brand_colors : [],
      reference_urls: Array.isArray(body.reference_urls) ? body.reference_urls : [],
      business_info: body.business_info ?? {},
      vision_brief: body.vision_brief ?? null,
      contact: {
        name: contact.name,
        email: String(contact.email).toLowerCase().trim(),
        phone: contact.phone,
        whatsapp: contact.whatsapp ?? null,
      },
      raw_payload: {},
      status: "new" as const,
      source: "marketplace",
    };

    const id = await createProjectIntake(payload, body as Record<string, unknown>);

    // Notify CRM (non-blocking) — reutiliza el patrón de leads/route.ts
    supabase
      .from("notifications")
      .insert({
        user_id: process.env.HOMEPTY_ADMIN_USER_ID ?? null,
        type: "nuevo_project_intake",
        title: "Nueva solicitud de sitio web",
        body: `${contact.name} quiere un sitio web${template_slug ? ` con la plantilla "${template_slug}"` : ""}.`,
        entity_type: "project_intake",
        entity_id: id,
        metadata: {
          project_type: body.project_type,
          template_slug,
          contact_email: payload.contact.email,
          source: "marketplace",
        },
        read: false,
      })
      .then(({ error }) => {
        if (error) console.warn("notification insert failed (non-blocking):", error.message);
      });

    return NextResponse.json({ success: true, id }, { status: 201, headers: CORS });
  } catch (err) {
    console.error("intake route error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: CORS }
    );
  }
}
