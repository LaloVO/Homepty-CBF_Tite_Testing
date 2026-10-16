import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { leerPedidoDeSubida, rutaNueva } from "@/lib/site-files";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/cbf/uploads
 * Permiso de subida de un archivo del sitio (documento de un lead, foto o documento de una captación).
 *
 * Body: `{ purpose: "lead_document" | "seller_document" | "seller_image", file_name, content_type }`.
 * Respuesta 201: `{ data: { path, upload_url, content_type } }`. El sitio hace `PUT upload_url` con el
 * archivo (cabecera `Content-Type: content_type`) y registra `path` en `/leads` o `/seller-inquiries`.
 * La URL vale para esa ruta y nada más, por 2 horas. Ver lib/site-files.ts.
 *
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 */
export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON" }, { status: 400 });
  }

  const pedido = leerPedidoDeSubida(body);
  if (!pedido.ok) return NextResponse.json({ error: pedido.error }, { status: pedido.status });

  const path = rutaNueva(authResult.siteId, pedido.nombre, crypto.randomUUID());
  const { data, error } = await supabase.storage.from(pedido.bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[CBF/uploads] No se pudo firmar la subida en", pedido.bucket, error?.message);
    return NextResponse.json({ error: "No fue posible preparar la subida del archivo" }, { status: 503 });
  }

  return NextResponse.json(
    { success: true, data: { path, upload_url: data.signedUrl, content_type: pedido.tipo } },
    { status: 201 },
  );
}
