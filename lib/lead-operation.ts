/**
 * HPY-205 — Qué se sabe de la operación de un lead de sitio satélite, sin mezclarlo.
 *
 * Tres datos distintos (owner, 2026-10-15), que no se promedian en uno:
 *
 * - **Unidad seleccionada**: la propiedad o unidad desde cuya ficha llegó el interesado
 *   (`solicitudes.id_propiedad`). Una búsqueda general llega sin ella.
 * - **Operación publicada**: la de ESA fila en `accionespropiedades` al momento del lead. Se guarda
 *   en `solicitudes.id_accion_propiedad`, con la misma convención que el intake v2 de la Suite para
 *   leads con propiedad: la operación del anuncio. Aportación (5), Inversión (7) o un valor nuevo no
 *   se vuelven compra.
 * - **Intención declarada**: lo que el interesado eligió en el formulario (compra o renta). Va en
 *   `site_intent` (buyer/renter) y en el enum legacy `tipo_operacion` (Comprar/Rentar). Puede no
 *   coincidir con la publicada: alguien puede querer comprar una propiedad que se anuncia en renta.
 *   Si no la eligió, `site_intent` queda `null`: la Suite lee ahí la intención declarada, y un
 *   «buyer» puesto por omisión sería indistinguible de uno elegido.
 *
 * Sin inmueble, `id_accion_propiedad` es la intención declarada (lo único que hay). La captación de
 * propietarios (`seller`) es un flujo aparte: no se liga a una ficha ni tiene operación publicada.
 *
 * `tipo_operacion` es un enum legacy NOT NULL que sólo tiene "Comprar" y "Rentar". Sin intención
 * declarada, se proyecta igual que el normalizador de la Suite (`legacyOperacionFromIdAccion`):
 * 2 → "Rentar", cualquier otra cosa → "Comprar".
 */

/** Ids de `accionespropiedades` que el formulario puede expresar como intención. */
const ID_POR_INTENCION = { compra: 1, renta: 2 } as const;
export type IntencionDeclarada = keyof typeof ID_POR_INTENCION;

export interface OperacionDelLead {
  /** `solicitudes.id_accion_propiedad`. `null` = desconocida. */
  idAccionPropiedad: number | null;
  /** Operación publicada del inmueble seleccionado al capturar el lead; `null` sin inmueble. */
  idAccionPublicada: number | null;
  /** Lo que eligió el interesado; `null` si no lo declaró. */
  intencionDeclarada: IntencionDeclarada | null;
  /** Proyección al enum legacy `solicitudes.tipo_operacion`. */
  tipoOperacionLegacy: "Comprar" | "Rentar";
  /** `solicitudes.site_intent`: la intención declarada, la captación, o `null` si no se declaró. */
  siteIntent: "buyer" | "renter" | "seller" | null;
}

export function leerIntencion(valor: unknown): IntencionDeclarada | null {
  const clave = typeof valor === "string" ? valor.toLowerCase().trim() : "";
  return clave === "compra" || clave === "renta" ? clave : null;
}

export function resolverOperacionDelLead(input: {
  leadKind?: unknown;
  /** La propiedad verificada del inventario del sitio, si el lead nace de una ficha. */
  propiedad?: { id_tipo_accion: number | null } | null;
  /** Lo que mandó el formulario ("compra" | "renta" | otra cosa). */
  tipoOperacionDelFormulario?: unknown;
}): OperacionDelLead {
  if (input.leadKind === "seller") {
    // Captación de propietarios: nadie declaró comprar ni rentar, y no hay ficha publicada.
    return { idAccionPropiedad: null, idAccionPublicada: null, intencionDeclarada: null, tipoOperacionLegacy: "Comprar", siteIntent: "seller" };
  }
  const intencion = leerIntencion(input.tipoOperacionDelFormulario);
  let publicada: number | null = null;
  if (input.propiedad) {
    const valor = Number(input.propiedad.id_tipo_accion);
    publicada = Number.isInteger(valor) && valor > 0 ? valor : null;
  }
  const idAccionPropiedad = input.propiedad ? publicada : intencion ? ID_POR_INTENCION[intencion] : null;
  const tipoOperacionLegacy = intencion ? (intencion === "renta" ? "Rentar" : "Comprar") : idAccionPropiedad === 2 ? "Rentar" : "Comprar";
  const siteIntent = intencion === "renta" ? "renter" : intencion === "compra" ? "buyer" : null;
  return { idAccionPropiedad, idAccionPublicada: publicada, intencionDeclarada: intencion, tipoOperacionLegacy, siteIntent };
}

/**
 * Valida el `id_propiedad` que manda el sitio. `undefined` = el lead no viene de una propiedad;
 * `null` = el valor no es un id válido (el llamador responde 400).
 */
export function leerIdPropiedad(valor: unknown): number | null | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export interface OperacionCatalogo { id: number; nombre: string | null; codigo: string | null }

/**
 * Adjunta a cada propiedad su operación publicada con el nombre del catálogo
 * (`accionespropiedades`), para que los sitios no mantengan su propia copia de etiquetas. Sin fila
 * en el catálogo, `operacion_publicada` es `null`: el sitio dice «por confirmar», no inventa.
 */
export function conOperacionPublicada<T extends { id_tipo_accion?: number | null }>(
  filas: T[],
  catalogo: OperacionCatalogo[],
): Array<T & { operacion_publicada: OperacionCatalogo | null }> {
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  return filas.map((f) => ({ ...f, operacion_publicada: f.id_tipo_accion != null ? porId.get(Number(f.id_tipo_accion)) ?? null : null }));
}
