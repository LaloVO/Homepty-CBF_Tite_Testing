import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { leerCaptacion } from "@/lib/seller-inquiry";
import { esRutaDelSitio, referenciaDelArchivo } from "@/lib/site-files";
import { verificarArchivosSubidos } from "@/lib/site-files-server";
import { supabase, supabaseUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/cbf/seller-inquiries
 * Registra la captación de un propietario (`seller_inquiries` y sus fotos, documentos y amenidades)
 * a nombre del asesor del sitio. Las fotos y documentos se suben antes con `POST /api/cbf/uploads` y
 * aquí llegan por ruta (`imagenes: [{ path, nombre_imagen, orden }]`,
 * `documentos: [{ path, nombre_documento, required }]`). Ver lib/seller-inquiry.ts.
 *
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 */
export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId, siteId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON" }, { status: 400 });
  }

  const leida = leerCaptacion(body, { rutaValida: (ruta) => esRutaDelSitio(ruta, siteId) });
  if (!leida.ok) return NextResponse.json({ error: leida.error }, { status: 400 });
  const { fila, imagenes, documentos, amenidades } = leida.captacion;

  if (fila.id_tipo_accion != null) {
    const { data: operacion, error } = await supabase
      .from("accionespropiedades")
      .select("id_accion_propiedad")
      .eq("id_accion_propiedad", fila.id_tipo_accion)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "No se pudo verificar la operación" }, { status: 503 });
    if (!operacion) return NextResponse.json({ error: "La operación no está en el catálogo" }, { status: 400 });
  }

  for (const [bucket, rutas] of [
    ["seller-inquiry-images", imagenes.map((i) => i.ruta)],
    ["seller-inquiry-docs", documentos.map((d) => d.ruta)],
  ] as const) {
    if (!rutas.length) continue;
    const verificados = await verificarArchivosSubidos(bucket, rutas);
    if (!verificados.ok) return NextResponse.json({ error: verificados.error }, { status: verificados.status });
  }

  const { data: captacion, error: insertError } = await supabase
    .from("seller_inquiries")
    .insert({ ...fila, advisor_user_id: userId })
    .select("id")
    .single();
  if (insertError || !captacion) {
    console.error("[CBF/seller-inquiries] Error insertando captación — code:", insertError?.code, insertError?.message);
    return NextResponse.json({ error: "No fue posible registrar la captación" }, { status: 500 });
  }

  // Sin transacción entre tablas: si una hija falla se borra la captación (sus hijas caen en cascada)
  // y el sitio recibe el error. Nunca queda una captación a medias.
  const hijas = [
    imagenes.length
      ? supabase.from("seller_inquiry_images").insert(
          imagenes.map((img) => ({
            id_seller_inquiry: captacion.id,
            image_url: referenciaDelArchivo(supabaseUrl, "seller-inquiry-images", img.ruta),
            nombre_imagen: img.nombre_imagen,
            orden: img.orden,
          })),
        )
      : null,
    documentos.length
      ? supabase.from("seller_inquiry_documents").insert(
          documentos.map((doc) => ({
            id_seller_inquiry: captacion.id,
            file_url: referenciaDelArchivo(supabaseUrl, "seller-inquiry-docs", doc.ruta),
            nombre_documento: doc.nombre_documento,
            required: doc.required,
          })),
        )
      : null,
    amenidades.length
      ? supabase.from("seller_inquiry_amenidades").insert(
          amenidades.map((id) => ({ id_seller_inquiry: captacion.id, id_amenidad: id })),
        )
      : null,
  ];
  const errores = (await Promise.all(hijas.map((q) => q ?? Promise.resolve({ error: null }))))
    .map((r) => r.error)
    .filter((e): e is NonNullable<typeof e> => !!e);
  if (errores.length) {
    console.error("[CBF/seller-inquiries] Error en hijas — codes:", errores.map((e) => e.code).join(","));
    const { error: deleteError } = await supabase.from("seller_inquiries").delete().eq("id", captacion.id);
    if (deleteError) console.error("[CBF/seller-inquiries] No se pudo deshacer la captación", captacion.id, deleteError.code);
    const fueraDeCatalogo = errores.some((e) => e.code === "23503");
    return NextResponse.json(
      { error: fueraDeCatalogo ? "Alguna amenidad no está en el catálogo" : "No fue posible registrar la captación" },
      { status: fueraDeCatalogo ? 400 : 500 },
    );
  }

  return NextResponse.json({ success: true, data: { id: captacion.id } }, { status: 201 });
}
