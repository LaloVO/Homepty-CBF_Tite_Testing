/**
 * Captación de propietarios desde un sitio satélite (`POST /api/cbf/seller-inquiries`).
 *
 * Owner, 2026-10-16: el sitio no escribe en Supabase; manda la captación a CBF con su token y CBF la
 * guarda. Por eso el asesor sale del token (`user_sites.user_id_supabase`), nunca del cuerpo: un
 * sitio no puede dejar captaciones a nombre de otro asesor. Sólo se aceptan columnas de
 * `seller_inquiries`; una llave desconocida se ignora en vez de tumbar la fila (antes PostgREST
 * rechazaba la captación entera por `id_tipo_accion` cuando no existía la columna).
 *
 * `id_tipo_accion` es la operación que el propietario quiere hacer (venta, renta, traspaso…), con
 * los ids de `accionespropiedades`; el llamador comprueba que exista en el catálogo.
 */

const TEXTOS = [
  "titulo_propiedad",
  "estado_nombre",
  "ciudad_nombre",
  "codigo_postal",
  "colonia",
  "direccion",
  "referencias",
  "descripcion_propiedad",
  "descripcion_estado_propiedad",
  "descripcion_inversion_propiedad",
] as const;
/** Ids de catálogo: enteros positivos. */
const IDS = ["id_tipo_accion", "id_tipo_propiedad", "id_estado", "id_ciudad"] as const;
/** Conteos: enteros desde 0. */
const CONTEOS = ["habitaciones_propiedad", "estacionamientos_propiedad", "numero_plantas"] as const;
/** Medidas y precio: números desde 0 (los baños admiten medios). */
const MEDIDAS = ["precio_propiedad", "area_propiedad", "area_construida", "banios_propiedad"] as const;
const COORDENADAS = ["latitud", "longitud"] as const;

export interface CaptacionLeida {
  fila: Record<string, string | number | boolean | null>;
  imagenes: Array<{ ruta: string; nombre_imagen: string | null; orden: number }>;
  documentos: Array<{ ruta: string; nombre_documento: string; required: boolean }>;
  amenidades: number[];
}

export type ResultadoCaptacion = { ok: true; captacion: CaptacionLeida } | { ok: false; error: string };

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function numero(valor: unknown): number | null | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const n = typeof valor === "number" ? valor : typeof valor === "string" ? Number(valor.replace(/,/g, "")) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function leerCaptacion(body: unknown, opciones: { rutaValida: (ruta: unknown) => boolean }): ResultadoCaptacion {
  const datos = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fila: CaptacionLeida["fila"] = {};

  const nombre = texto(datos.nombre_completo);
  const email = texto(datos.email);
  const telefono = texto(datos.telefono);
  if (!nombre || !email || !telefono) {
    return { ok: false, error: "Faltan datos de contacto obligatorios (nombre_completo, email, telefono)" };
  }
  fila.nombre_completo = nombre;
  fila.email = email.toLowerCase();
  fila.telefono = telefono;

  for (const campo of TEXTOS) {
    const valor = texto(datos[campo]);
    if (valor !== null) fila[campo] = valor;
  }
  for (const campo of IDS) {
    const valor = numero(datos[campo]);
    if (valor === undefined) continue;
    if (valor === null || !Number.isSafeInteger(valor) || valor <= 0) return { ok: false, error: `${campo} inválido` };
    fila[campo] = valor;
  }
  for (const campo of CONTEOS) {
    const valor = numero(datos[campo]);
    if (valor === undefined) continue;
    if (valor === null || !Number.isSafeInteger(valor) || valor < 0) return { ok: false, error: `${campo} inválido` };
    fila[campo] = valor;
  }
  for (const campo of MEDIDAS) {
    const valor = numero(datos[campo]);
    if (valor === undefined) continue;
    if (valor === null || valor < 0) return { ok: false, error: `${campo} inválido` };
    fila[campo] = valor;
  }
  for (const campo of COORDENADAS) {
    const valor = numero(datos[campo]);
    if (valor === undefined) continue;
    const limite = campo === "latitud" ? 90 : 180;
    if (valor === null || Math.abs(valor) > limite) return { ok: false, error: `${campo} inválida` };
    fila[campo] = valor;
  }
  fila.es_herencia = datos.es_herencia === true;

  const imagenes: CaptacionLeida["imagenes"] = [];
  if (datos.imagenes !== undefined) {
    if (!Array.isArray(datos.imagenes)) return { ok: false, error: "imagenes debe ser una lista" };
    for (const [i, img] of datos.imagenes.entries()) {
      const item = (img && typeof img === "object" ? img : {}) as Record<string, unknown>;
      if (!opciones.rutaValida(item.path)) return { ok: false, error: `La foto ${i + 1} no tiene una ruta emitida por CBF para este sitio` };
      const orden = numero(item.orden);
      imagenes.push({
        ruta: item.path as string,
        nombre_imagen: texto(item.nombre_imagen),
        orden: orden !== undefined && orden !== null && Number.isSafeInteger(orden) ? orden : i,
      });
    }
  }

  const documentos: CaptacionLeida["documentos"] = [];
  if (datos.documentos !== undefined) {
    if (!Array.isArray(datos.documentos)) return { ok: false, error: "documentos debe ser una lista" };
    for (const [i, doc] of datos.documentos.entries()) {
      const item = (doc && typeof doc === "object" ? doc : {}) as Record<string, unknown>;
      const nombreDocumento = texto(item.nombre_documento);
      if (!nombreDocumento) return { ok: false, error: `El documento ${i + 1} no tiene nombre_documento` };
      if (!opciones.rutaValida(item.path)) return { ok: false, error: `El documento ${nombreDocumento} no tiene una ruta emitida por CBF para este sitio` };
      documentos.push({ ruta: item.path as string, nombre_documento: nombreDocumento, required: item.required === true });
    }
  }

  const amenidades: number[] = [];
  if (datos.amenidades !== undefined) {
    if (!Array.isArray(datos.amenidades)) return { ok: false, error: "amenidades debe ser una lista de ids" };
    for (const valor of datos.amenidades) {
      const id = numero(valor);
      if (id === undefined || id === null || !Number.isSafeInteger(id) || id <= 0) return { ok: false, error: "amenidades contiene un id inválido" };
      if (!amenidades.includes(id)) amenidades.push(id);
    }
  }

  return { ok: true, captacion: { fila, imagenes, documentos, amenidades } };
}
