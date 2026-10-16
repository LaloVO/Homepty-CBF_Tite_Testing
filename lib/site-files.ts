/**
 * Archivos que adjuntan los sitios satélite: documentos del embudo de un lead y fotos o documentos
 * de una captación de propietario.
 *
 * Owner, 2026-10-16: los sitios no usan Supabase (ni variables ni llaves); sólo el token de CBF, y
 * es CBF quien escribe en Supabase. Por eso el sitio no elige bucket ni ruta: pide permiso a CBF
 * (`POST /api/cbf/uploads`), que decide dónde va el archivo y firma una URL de subida de un solo uso
 * para ESA ruta. El navegador manda los bytes a esa URL (un archivo no cabe en los 4.5 MB que admite
 * el cuerpo de una función de Vercel) y después registra el lead o la captación con la ruta. CBF
 * comprueba que la ruta sea de este sitio y que el archivo exista antes de guardarla.
 *
 * Las rutas llevan el sitio (`sitios/<siteId>/<uuid>/<archivo>`): un sitio no puede registrar como
 * suyo un archivo de otro, ni reemplazar uno ya subido (cada permiso es una ruta nueva, sin upsert).
 *
 * La referencia que se guarda es la URL del objeto con la forma que ya leen la Suite y su
 * deduplicación de expedientes (`…/storage/v1/object/public/<bucket>/<ruta>`). No da acceso por sí
 * misma: en un bucket privado esa dirección no sirve el archivo, y la Suite firma un enlace corto
 * cuando un asesor autorizado lo abre.
 */

const PDF = "application/pdf";
const IMAGENES_DE_DOCUMENTO = ["image/jpeg", "image/png"] as const;
const WORD = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
const FOTOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"] as const;

/** Para qué se sube el archivo. Cada propósito tiene un bucket y los tipos que aceptan sus formularios. */
export const PROPOSITOS = {
  /** Expediente del embudo de 6 pasos (INE, comprobantes…). */
  lead_document: { bucket: "documentos-leads", tipos: [PDF, ...IMAGENES_DE_DOCUMENTO] },
  /** Documentos de la propiedad en una captación (escrituras, predial…). */
  seller_document: { bucket: "seller-inquiry-docs", tipos: [PDF, ...WORD, ...IMAGENES_DE_DOCUMENTO] },
  /** Fotos de la propiedad en una captación. */
  seller_image: { bucket: "seller-inquiry-images", tipos: FOTOS },
} as const;

export type Proposito = keyof typeof PROPOSITOS;
export type BucketDeSitio = (typeof PROPOSITOS)[Proposito]["bucket"];

/** Si el navegador no sabe el tipo (pasa con HEIC o .docx en algunos sistemas), se toma de la extensión. */
const TIPO_POR_EXTENSION: Record<string, string> = {
  pdf: PDF,
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const NOMBRE_DE_ARCHIVO = "[A-Za-z0-9_-][A-Za-z0-9._-]{0,119}";
const MAX_NOMBRE = 120;

/** Nombre de objeto válido que conserva la extensión. Sin carpetas ni puntos iniciales: nunca sale de su ruta. */
export function nombreSeguro(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? "";
  const limpio = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "");
  if (!limpio) return "archivo";
  if (limpio.length <= MAX_NOMBRE) return limpio;
  const punto = limpio.lastIndexOf(".");
  const extension = punto > 0 && limpio.length - punto <= 10 ? limpio.slice(punto) : "";
  return limpio.slice(0, MAX_NOMBRE - extension.length) + extension;
}

/** Ruta nueva para un archivo de este sitio. `uuid` la hace única: nada se sobrescribe. */
export function rutaNueva(siteId: string, nombre: string, uuid: string): string {
  if (!new RegExp(`^${UUID}$`, "i").test(siteId)) throw new Error("siteId inválido");
  if (!new RegExp(`^${UUID}$`, "i").test(uuid)) throw new Error("uuid inválido");
  return `sitios/${siteId.toLowerCase()}/${uuid.toLowerCase()}/${nombreSeguro(nombre)}`;
}

/** ¿La ruta la emitió CBF para ESTE sitio? Cualquier otra forma (otro sitio, `..`, carpetas extra) no vale. */
export function esRutaDelSitio(ruta: unknown, siteId: string): ruta is string {
  if (typeof ruta !== "string" || !new RegExp(`^${UUID}$`, "i").test(siteId)) return false;
  return new RegExp(`^sitios/${siteId.toLowerCase()}/${UUID}/${NOMBRE_DE_ARCHIVO}$`).test(ruta);
}

/** La URL del objeto que se guarda como referencia (ver el encabezado: no da acceso por sí misma). */
export function referenciaDelArchivo(supabaseUrl: string, bucket: BucketDeSitio, ruta: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${ruta}`;
}

export type PedidoDeSubida =
  | { ok: true; proposito: Proposito; bucket: BucketDeSitio; nombre: string; tipo: string }
  | { ok: false; status: 400 | 415; error: string };

/** Lee `{ purpose, file_name, content_type }` del sitio. El tipo tiene que ser uno de los que acepta ese formulario. */
export function leerPedidoDeSubida(body: unknown): PedidoDeSubida {
  const datos = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const proposito = datos.purpose;
  if (typeof proposito !== "string" || !Object.hasOwn(PROPOSITOS, proposito)) {
    return { ok: false, status: 400, error: `purpose debe ser uno de: ${Object.keys(PROPOSITOS).join(", ")}` };
  }
  const nombre = typeof datos.file_name === "string" ? datos.file_name.trim() : "";
  if (!nombre || nombre.length > 255) {
    return { ok: false, status: 400, error: "file_name es obligatorio (máximo 255 caracteres)" };
  }
  const { bucket, tipos } = PROPOSITOS[proposito as Proposito];
  const declarado = typeof datos.content_type === "string" ? datos.content_type.toLowerCase().split(";")[0].trim() : "";
  const extension = nombre.includes(".") ? nombre.split(".").pop()!.toLowerCase() : "";
  const tipo = (tipos as readonly string[]).includes(declarado)
    ? declarado
    : !declarado || declarado === "application/octet-stream"
      ? TIPO_POR_EXTENSION[extension] ?? ""
      : "";
  if (!(tipos as readonly string[]).includes(tipo)) {
    return { ok: false, status: 415, error: `Tipo de archivo no admitido para ${proposito}: ${declarado || extension || "desconocido"}` };
  }
  return { ok: true, proposito: proposito as Proposito, bucket, nombre, tipo };
}

export type DocumentosDelLead =
  | { ok: true; documentos: Array<{ clave: string; ruta: string }> }
  | { ok: false; error: string };

/**
 * ¿Una URL de `documentos_urls` (sitios anteriores) apunta a un archivo que CBF emitió para algún
 * sitio? Esos sólo se registran por `documentos`, donde se comprueba que sean de este sitio; si no, un
 * sitio podría colgar en su lead el expediente de otro y la Suite le firmaría el enlace.
 */
export function apuntaARutaDeSitio(valor: unknown, supabaseUrl: string): boolean {
  if (typeof valor !== "string") return false;
  try {
    const url = new URL(valor);
    if (url.origin !== new URL(supabaseUrl).origin) return false;
    return /^\/storage\/v1\/object\/[^/]+\/[^/]+\/sitios\//.test(decodeURIComponent(url.pathname));
  } catch {
    return false;
  }
}

/**
 * `documentos` del lead: `{ <documento>: <ruta> }` con rutas que CBF emitió para este sitio. Ausente
 * = el lead no trae archivos subidos con permiso de CBF (los sitios anteriores mandan
 * `documentos_urls`, que se guarda como antes).
 */
export function leerDocumentosDelLead(valor: unknown, siteId: string): DocumentosDelLead {
  if (valor === undefined || valor === null) return { ok: true, documentos: [] };
  if (typeof valor !== "object" || Array.isArray(valor)) return { ok: false, error: "documentos debe ser un objeto { documento: ruta }" };
  const documentos: Array<{ clave: string; ruta: string }> = [];
  for (const [clave, ruta] of Object.entries(valor)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(clave)) return { ok: false, error: `Documento inválido: ${clave.slice(0, 40)}` };
    if (!esRutaDelSitio(ruta, siteId)) return { ok: false, error: `La ruta del documento ${clave} no la emitió CBF para este sitio` };
    documentos.push({ clave, ruta });
  }
  return { ok: true, documentos };
}
