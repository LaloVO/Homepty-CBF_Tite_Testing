/**
 * Catálogos que los formularios de los sitios necesitan (estados, ciudades, amenidades, tipos de
 * propiedad y operaciones). Owner, 2026-10-16: los sitios no leen Supabase; los piden a CBF con su
 * token. Se entregan con los nombres de columna de la base, que son los ids que guardan los leads
 * y las captaciones.
 */
export const CATALOGOS = {
  estados: { tabla: "estados", columnas: "id_estado, nombre_estado", orden: "nombre_estado" },
  ciudades: { tabla: "ciudades", columnas: "id_ciudad, nombre_ciudad", orden: "nombre_ciudad" },
  amenidades: { tabla: "amenidades", columnas: "id_amenidad, nombre_amenidad", orden: "nombre_amenidad" },
  "tipos-propiedad": { tabla: "tipospropiedades", columnas: "id_tipo_propiedad, nombre_tipo_propiedad", orden: "id_tipo_propiedad" },
  operaciones: {
    tabla: "accionespropiedades",
    columnas: "id_accion_propiedad, nombre_accion_propiedad, operation_code",
    orden: "id_accion_propiedad",
  },
} as const;

export type NombreDeCatalogo = keyof typeof CATALOGOS;

export type ConsultaDeCatalogo =
  | { ok: true; tabla: string; columnas: string; orden: string; idEstado?: number }
  | { ok: false; status: 400 | 404; error: string };

/** Qué leer para `GET /api/cbf/catalogs/<nombre>`. Las ciudades sólo se piden por estado. */
export function leerConsultaDeCatalogo(nombre: string, params: URLSearchParams): ConsultaDeCatalogo {
  if (!Object.hasOwn(CATALOGOS, nombre)) {
    return { ok: false, status: 404, error: `Catálogo desconocido. Disponibles: ${Object.keys(CATALOGOS).join(", ")}` };
  }
  const { tabla, columnas, orden } = CATALOGOS[nombre as NombreDeCatalogo];
  if (nombre !== "ciudades") return { ok: true, tabla, columnas, orden };
  const idEstado = Number(params.get("id_estado"));
  if (!Number.isSafeInteger(idEstado) || idEstado <= 0) {
    return { ok: false, status: 400, error: "ciudades requiere id_estado (entero positivo)" };
  }
  return { ok: true, tabla, columnas, orden, idEstado };
}
