/**
 * HPY-205 — La operación de un lead de sitio satélite.
 *
 * La regla del ecosistema (Suite, HPY-205): la operación de una unidad no colapsa a compraventa.
 * Aportación (5), Inversión (7) o un valor nuevo no son "Comprar". Cuando el lead nace de una
 * propiedad, su operación es la de ESA propiedad tal como está en `accionespropiedades`. Cuando
 * nace del buscador genérico, sólo vale lo que el formulario puede decir: compra o renta. Lo
 * demás queda desconocido (null), nunca supuesto.
 *
 * `tipo_operacion` de `solicitudes` es un enum legacy NOT NULL que sólo tiene "Comprar" y
 * "Rentar". Se llena igual que el normalizador de la Suite
 * (`homepty_new/src/server/matching/normalize-lead.ts`, `legacyOperacionFromIdAccion`):
 * 2 → "Rentar", cualquier otra cosa → "Comprar". La verdad vive en `id_accion_propiedad`.
 */

/** Ids de `accionespropiedades` que el formulario genérico puede expresar. */
const OPERACION_POR_FORMULARIO: Record<string, number> = { compra: 1, renta: 2 };

export interface OperacionDelLead {
  /** FK a `accionespropiedades`. `null` = desconocida. */
  idAccionPropiedad: number | null;
  /** Proyección al enum legacy `solicitudes.tipo_operacion`. */
  tipoOperacionLegacy: "Comprar" | "Rentar";
}

export function resolverOperacionDelLead(input: {
  /** `propiedades.id_tipo_accion` de la propiedad del lead, si el lead nace de una. */
  idTipoAccionDePropiedad?: number | null;
  /** Lo que mandó el formulario ("compra" | "renta" | otra cosa). */
  tipoOperacionDelFormulario?: unknown;
  /** `true` cuando el lead viene ligado a una propiedad verificada. */
  conPropiedad: boolean;
}): OperacionDelLead {
  let id: number | null;
  if (input.conPropiedad) {
    // La propiedad manda: el lead es sobre ese inmueble y su operación es la de esa fila.
    const valor = Number(input.idTipoAccionDePropiedad);
    id = Number.isInteger(valor) && valor > 0 ? valor : null;
  } else {
    const clave = typeof input.tipoOperacionDelFormulario === "string"
      ? input.tipoOperacionDelFormulario.toLowerCase().trim()
      : "";
    id = OPERACION_POR_FORMULARIO[clave] ?? null;
  }
  return { idAccionPropiedad: id, tipoOperacionLegacy: id === 2 ? "Rentar" : "Comprar" };
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
