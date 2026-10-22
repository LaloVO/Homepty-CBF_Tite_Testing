/**
 * Qué puede salir de una propiedad por la API de CBF (owner, 2026-10-21).
 *
 * La llave del sitio es pública (ver `verifyApiKey` en lib/auth.ts): todo lo que una ruta entrega con
 * ella lo puede leer cualquiera. Por eso sólo sale lo que ya es público:
 *
 * - **Publicadas.** La política pública de la Suite y Welcome, que son las dueñas del inventario
 *   (`homepty_new/src/lib/share/publicacion.ts`, `Homepty_welcome/lib/property/publication.ts`):
 *   `status = 'activo'` y, si la capturó un propietario, aprobada. Se replica la política, no se
 *   inventa otra; las copias deben converger.
 * - **Columnas explícitas.** Las que leen los sitios y son públicas; nunca `select('*')`. No salen
 *   `direccion` (ni calle, números, código postal ni folio real), comisiones, propietario, moderación,
 *   borradores de captura, datos de EasyBroker ni vectores.
 * - **Precio oculto.** Con `show_prices = false` el precio sale `null` y `show_prices` se conserva
 *   para que el sitio diga «Precio a consultar».
 */

/** Estado de inventario que se publica. */
export const PUBLIC_STATUS = "activo";

/**
 * Filtro `.or()` de PostgREST: una propiedad que capturó un propietario sólo sale aprobada; las demás
 * no pasan por esa puerta. El `origen_propiedad.is.null` no sobra: en SQL `null <> 'owner'` no es
 * verdadero y una propiedad sin origen desaparecería. Juntas reproducen
 * `origen_propiedad IS DISTINCT FROM 'owner' OR aprobacion_status = 'aprobado'`.
 */
export const APPROVAL_GATE =
  "origen_propiedad.is.null,origen_propiedad.neq.owner,aprobacion_status.eq.aprobado";

/** La misma política, para una fila ya leída (p. ej. la propiedad ligada a un post). */
export function esPublicable(fila: {
  status?: unknown;
  origen_propiedad?: unknown;
  aprobacion_status?: unknown;
}): boolean {
  if (fila.status !== PUBLIC_STATUS) return false;
  return fila.origen_propiedad !== "owner" || fila.aprobacion_status === "aprobado";
}

/**
 * Columnas de `propiedades` que salen: las que leen la plantilla, el product shell y los sitios de
 * CBF-Sites. `status` siempre es `activo`, pero la plantilla lo lee para decidir qué publica.
 * Ubicación: la de la Suite y Welcome (colonia, ciudad, estado y coordenadas), sin `direccion`.
 */
export const COLUMNAS_PUBLICAS = [
  "id",
  "nombre",
  "tipo",
  "descripcion",
  "descripcion_estado",
  "descripcion_inversion",
  "caracteristicas",
  "precio",
  "moneda",
  "show_prices",
  "id_tipo_accion",
  "status",
  "area",
  "area_construida",
  "dimension_terreno",
  "habitaciones",
  "banios",
  "medios_banios",
  "estacionamientos",
  "numero_pisos",
  "nivel_piso",
  "colonia",
  "ciudad_nombre",
  "estado_nombre",
  "latitud",
  "longitud",
  "is_unit",
  "parent_id",
  "development_verticals",
  "taxonomy_entries",
  "fecha_inicio",
  "fecha_entrega",
] as const;

/** Relaciones que viajan con la propiedad, con sus columnas públicas. */
const RELACIONES_PUBLICAS = {
  imagenes_propiedades: ["image_url"],
  amenidades_propiedades: ["id_amenidad"],
} as const;

export const SELECT_PROPIEDAD_PUBLICA = [
  ...COLUMNAS_PUBLICAS,
  ...Object.entries(RELACIONES_PUBLICAS).map(([tabla, columnas]) => `${tabla}(${columnas.join(", ")})`),
].join(", ");

export type PropiedadPublica = Record<string, unknown> & { id_tipo_accion?: number | null };

function elegir(fila: Record<string, unknown>, columnas: readonly string[]): Record<string, unknown> {
  const elegidas: Record<string, unknown> = {};
  for (const columna of columnas) if (columna in fila) elegidas[columna] = fila[columna];
  return elegidas;
}

/**
 * Lo que sale de una fila: sólo las columnas públicas que trae (y de sus relaciones, las públicas).
 * Recibe la fila cruda de PostgREST: el `select` se arma en tiempo de ejecución y no tiene tipo.
 * Precio oculto → `null`: ni 0 ni la clave ausente. Los sitios que lo protegen (shell, cassou,
 * asesor-demo) dicen «Precio a consultar» con `null` y «$0» con 0; los que no, «$0» con `null` y
 * «$NaN» sin la clave.
 */
export function proyectarPropiedadPublica(fila: object): PropiedadPublica {
  const cruda = fila as Record<string, unknown>;
  const publica = elegir(cruda, COLUMNAS_PUBLICAS);
  for (const [tabla, columnas] of Object.entries(RELACIONES_PUBLICAS)) {
    const hijas = cruda[tabla];
    if (Array.isArray(hijas)) publica[tabla] = hijas.map((hija) => elegir(hija, columnas));
  }
  if (publica.show_prices === false && "precio" in publica) publica.precio = null;
  return publica as PropiedadPublica;
}
