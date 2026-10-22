import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  APPROVAL_GATE,
  COLUMNAS_PUBLICAS,
  PUBLIC_STATUS,
  SELECT_PROPIEDAD_PUBLICA,
  esPublicable,
  proyectarPropiedadPublica,
} from "../lib/property-publication.ts";

/*
 * Por qué importa (owner, 2026-10-21): la llave del sitio viaja en el bundle de una SPA estática, así
 * que todo lo que CBF responde con ella lo puede leer cualquiera. `/properties` respondía
 * `select('*')`: borradores y pausadas, precios que el asesor ocultó, `direccion` con calle y número,
 * folio real, comisiones, el propietario, la moderación y los vectores; `/user` y `/posts` entregaban
 * filas internas. Si cualquiera de esas fugas vuelve, esto falla. Y si la API deja de entregar lo que
 * los sitios leen, también: la plantilla perdería sus unidades o el sitio mostraría «$NaN».
 */

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

/** Esquema real de `propiedades` (information_schema de la base de la Suite, 2026-10-21). */
const COLUMNAS_DE_PROPIEDADES = [
  "id", "created_at", "updated_at", "nombre", "id_tipo_accion", "id_tipo_uso", "descripcion",
  "descripcion_estado", "descripcion_inversion", "id_estado", "id_ciudad", "direccion", "colonia",
  "area", "precio", "habitaciones", "banios", "estacionamientos", "caracteristicas", "id_usuario",
  "codigo_postal", "area_construida", "is_unit", "parent_id", "tipo", "easybroker_id",
  "easybroker_images_json", "easybroker_features", "easybroker_source_data", "latitud", "longitud",
  "floor_plan_url", "ciudad_nombre", "estado_nombre", "development_verticals", "taxonomy_entries",
  "industria_scian_ids", "sub_industria_scian_ids", "status", "medios_banios", "moneda", "show_prices",
  "id_status_propiedad", "comision", "fecha_inicio", "fecha_entrega", "disponibilidad_tipo",
  "disponibilidad_valor", "aprobacion_status", "origen_propiedad", "id_usuario_owner",
  "tipo_usuario_propietario", "draft_payload", "taxonomia_embedding", "geom", "descripcion_embedding",
  "es_herencia", "fecha_envio_aprobacion", "motivo_rechazo", "fecha_aprobacion", "aprobado_por",
  "cvegeo", "cvegeo_fuente", "cvegeo_resuelto_at", "comision_compartida", "numero_pisos", "nivel_piso",
  "etapa_id", "descripcion_embedding_hash", "calle", "numero_exterior", "numero_interior",
  "dimension_terreno", "folio_real",
];

/** Lo que nunca sale con la llave pública, y por qué. */
const PRIVADAS = {
  direccion: "la dirección del inmueble (owner: sin `direccion`)",
  calle: "dirección", numero_exterior: "dirección", numero_interior: "dirección", codigo_postal: "dirección",
  folio_real: "folio del Registro Público",
  comision: "condición comercial del asesor", comision_compartida: "condición comercial del asesor",
  id_usuario: "identidad del asesor", id_usuario_owner: "identidad del propietario",
  tipo_usuario_propietario: "dato del propietario", es_herencia: "situación jurídica del inmueble",
  origen_propiedad: "moderación", aprobacion_status: "moderación", motivo_rechazo: "moderación",
  aprobado_por: "moderación", fecha_envio_aprobacion: "moderación", fecha_aprobacion: "moderación",
  draft_payload: "captura a medias", easybroker_source_data: "payload de sincronización",
  taxonomia_embedding: "vector (el ranking)", descripcion_embedding: "vector (el ranking)",
  descripcion_embedding_hash: "vector", geom: "geometría interna",
};

/**
 * Lo que leen los consumidores de CBF-Sites (plantilla, product shell, cassou, asesor-demo,
 * ruth-flores, ijbasesoria, Frank Co, premium, roma, raquel, all-home y agencia-pw0001..0038; análisis
 * del 2026-10-21) y existe en `propiedades`. Críticas: `status`, `is_unit` y `parent_id` (la plantilla
 * agrupa y publica unidades con ellas), `show_prices` (dice «Precio a consultar»), `nombre` (varios
 * sitios llaman `nombre.toLowerCase()` sin guarda).
 */
const LEIDAS_POR_LOS_SITIOS = [
  "id", "nombre", "tipo", "descripcion", "descripcion_estado", "descripcion_inversion", "caracteristicas",
  "precio", "moneda", "show_prices", "id_tipo_accion", "status", "area", "area_construida",
  "dimension_terreno", "habitaciones", "banios", "medios_banios", "estacionamientos", "numero_pisos",
  "nivel_piso", "colonia", "ciudad_nombre", "estado_nombre", "latitud", "longitud", "is_unit", "parent_id",
  "development_verticals", "taxonomy_entries", "fecha_inicio", "fecha_entrega",
];

/** Una fila con TODAS las columnas reales, como la devolvía `select('*')`. */
function filaCompleta(extra = {}) {
  const fila = Object.fromEntries(COLUMNAS_DE_PROPIEDADES.map((columna) => [columna, `valor-de-${columna}`]));
  return {
    ...fila,
    status: "activo",
    precio: 2345678,
    show_prices: true,
    id_tipo_accion: 1,
    imagenes_propiedades: [{ id: 9, id_propiedad: 1, created_at: "2026-10-01", image_url: "https://img/1.jpg" }],
    amenidades_propiedades: [{ id: 4, id_propiedad: 1, created_at: "2026-10-01", id_amenidad: 12 }],
    ...extra,
  };
}

test("cada columna pública existe en `propiedades`: un nombre equivocado tumba con 400 la API de todos los sitios", () => {
  for (const columna of COLUMNAS_PUBLICAS) {
    assert.ok(COLUMNAS_DE_PROPIEDADES.includes(columna), `${columna} no es columna de propiedades`);
  }
});

test("lo privado nunca está en la proyección ni en el select", () => {
  for (const [columna, porque] of Object.entries(PRIVADAS)) {
    assert.equal(COLUMNAS_PUBLICAS.includes(columna), false, `${columna}: ${porque}`);
    assert.doesNotMatch(SELECT_PROPIEDAD_PUBLICA, new RegExp(`\\b${columna}\\b`), `${columna}: ${porque}`);
  }
  assert.doesNotMatch(SELECT_PROPIEDAD_PUBLICA, /\*/, "nunca select('*')");
});

test("de una fila completa sólo salen las columnas públicas, y de sus relaciones sólo lo que leen los sitios", () => {
  const publica = proyectarPropiedadPublica(filaCompleta());
  const permitidas = new Set([...COLUMNAS_PUBLICAS, "imagenes_propiedades", "amenidades_propiedades"]);
  for (const clave of Object.keys(publica)) assert.ok(permitidas.has(clave), `salió ${clave}`);
  for (const columna of Object.keys(PRIVADAS)) assert.equal(columna in publica, false, `salió ${columna}`);
  assert.deepEqual(publica.imagenes_propiedades, [{ image_url: "https://img/1.jpg" }]);
  assert.deepEqual(publica.amenidades_propiedades, [{ id_amenidad: 12 }]);
});

test("los sitios siguen recibiendo todo lo que leen (salvo `direccion`, que se quita a propósito)", () => {
  for (const columna of LEIDAS_POR_LOS_SITIOS) {
    assert.ok(COLUMNAS_PUBLICAS.includes(columna), `los sitios leen ${columna}`);
  }
  const publica = proyectarPropiedadPublica(filaCompleta());
  for (const columna of LEIDAS_POR_LOS_SITIOS) assert.ok(columna in publica, `falta ${columna}`);
});

test("precio oculto: sale `null` (ni 0 ni sin clave), `show_prices` se conserva y nada lo delata", () => {
  const publica = proyectarPropiedadPublica(filaCompleta({ show_prices: false }));
  assert.equal(publica.precio, null,
    "con 0 el shell, cassou y asesor-demo dirían «$0» en vez de «Precio a consultar»");
  assert.ok("precio" in publica, "sin la clave, 18 de los 19 sitios agencia-pw muestran «$NaN»");
  assert.equal(publica.show_prices, false, "el sitio la necesita para decir «Precio a consultar»");
  assert.doesNotMatch(JSON.stringify(publica), /2345678/, "ningún otro campo lleva el monto");
});

test("precio visible: `show_prices` true o null (el default de la columna) publica el precio", () => {
  for (const show_prices of [true, null, undefined]) {
    assert.equal(proyectarPropiedadPublica(filaCompleta({ show_prices })).precio, 2345678, `show_prices=${show_prices}`);
  }
});

/**
 * Cómo evalúa PostgREST `or=(col.op.valor,...)`, con la lógica de tres valores de SQL: `col = x` y
 * `col <> x` con `col` NULL dan NULL, que no es verdadero; sólo `is.null` mira el NULL.
 */
function evaluaFiltroOr(filtro, fila) {
  const resultados = filtro.split(",").map((termino) => {
    const [columna, operador, ...resto] = termino.split(".");
    const esperado = resto.join(".");
    const valor = fila[columna] ?? null;
    if (operador === "is") return esperado === "null" ? valor === null : valor !== null;
    if (valor === null) return null;
    if (operador === "eq") return valor === esperado;
    if (operador === "neq") return valor !== esperado;
    throw new Error(`operador no soportado: ${operador}`);
  });
  if (resultados.includes(true)) return true;
  return resultados.includes(null) ? null : false;
}
const pasaLaConsulta = (fila) => fila.status === PUBLIC_STATUS && evaluaFiltroOr(APPROVAL_GATE, fila) === true;

test("publicada = activa y, si la capturó un propietario, aprobada (la política pública de la Suite y Welcome)", () => {
  const casos = [
    [{ status: "activo", origen_propiedad: "homepty", aprobacion_status: "no_aplica" }, true, "las 275 publicadas de hoy"],
    [{ status: "activo", origen_propiedad: "owner", aprobacion_status: "pendiente" }, false, "las 7 de propietario sin aprobar"],
    [{ status: "activo", origen_propiedad: "owner", aprobacion_status: "en_revision" }, false, "en revisión no es aprobada"],
    [{ status: "activo", origen_propiedad: "owner", aprobacion_status: "rechazado" }, false, "rechazada"],
    [{ status: "activo", origen_propiedad: "owner", aprobacion_status: null }, false, "sin aprobación"],
    [{ status: "activo", origen_propiedad: "owner", aprobacion_status: "aprobado" }, true, "aprobada"],
    [{ status: "activo", origen_propiedad: null, aprobacion_status: null }, true, "sin origen no es de propietario"],
    [{ status: "borrador", origen_propiedad: "homepty", aprobacion_status: "no_aplica" }, false, "borrador"],
    [{ status: "pausado", origen_propiedad: "homepty", aprobacion_status: "no_aplica" }, false, "pausada"],
    [{ status: "eliminado", origen_propiedad: "homepty", aprobacion_status: "no_aplica" }, false, "eliminada"],
  ];
  for (const [fila, esperado, porque] of casos) {
    assert.equal(esPublicable(fila), esperado, `en memoria: ${porque}`);
    assert.equal(pasaLaConsulta(fila), esperado, `en la consulta: ${porque}`);
  }
});

test("la consulta y la evaluación en memoria son la misma política para toda combinación (NULL incluido)", () => {
  for (const status of ["activo", "pausado", "borrador", "eliminado"]) {
    for (const origen_propiedad of ["homepty", "owner", null]) {
      for (const aprobacion_status of ["pendiente", "en_revision", "aprobado", "rechazado", "no_aplica", null]) {
        const fila = { status, origen_propiedad, aprobacion_status };
        assert.equal(pasaLaConsulta(fila), esPublicable(fila), JSON.stringify(fila));
      }
    }
  }
});

test("listado y ficha: sólo lo publicado y con la proyección pública; la ficha no publicada es 404", () => {
  for (const ruta of ["app/api/cbf/properties/route.ts", "app/api/cbf/properties/[id]/route.ts"]) {
    const fuente = leer(ruta);
    assert.match(fuente, /\.select\(SELECT_PROPIEDAD_PUBLICA/, `${ruta}: proyección explícita`);
    assert.match(fuente, /\.eq\("status", PUBLIC_STATUS\)\s*\.or\(APPROVAL_GATE\)/, `${ruta}: política en la consulta`);
    assert.doesNotMatch(fuente, /\.select\("\*/, `${ruta}: nunca select('*')`);
    assert.doesNotMatch(fuente, /\.neq\("status", "eliminado"\)/, `${ruta}: no basta con excluir eliminadas`);
  }
  assert.match(leer("app/api/cbf/properties/route.ts"), /\(data \|\| \[\]\)\.map\(proyectarPropiedadPublica\)/,
    "el listado enmascara el precio oculto de cada fila");
  const ficha = leer("app/api/cbf/properties/[id]/route.ts");
  assert.match(ficha, /\[proyectarPropiedadPublica\(data\)\]/, "la ficha enmascara el precio oculto");
  assert.match(ficha, /PGRST116[\s\S]*?status: 404/, "lo que el filtro deja fuera responde 404");
});

test("posts: sólo publicados y fuera de comunidades privadas; su propiedad, sólo publicada y proyectada", () => {
  const fuente = leer("app/api/cbf/posts/route.ts");
  assert.match(fuente, /\.eq\("is_published", true\)/, "un borrador del Hub no es público (HPY-132)");
  assert.match(fuente, /return !community\?\.is_private;/, "un post de comunidad privada nunca sale");
  assert.match(fuente, /property && esPublicable\(property\) \? proyectarPropiedadPublica\(property\) : null/,
    "una propiedad no publicada no viaja con el post, y la publicada sale proyectada");
  const embed = fuente.match(/property:propiedades!hub_posts_property_id_fkey \(([\s\S]*?)imagenes_propiedades/)[1];
  const columnas = embed.split(",").map((c) => c.trim()).filter(Boolean);
  for (const columna of columnas) {
    assert.ok(COLUMNAS_PUBLICAS.includes(columna) || ["origen_propiedad", "aprobacion_status"].includes(columna),
      `el post pide ${columna}`);
  }
  assert.ok(columnas.includes("show_prices"), "sin show_prices no se puede enmascarar el precio");
  for (const columna of ["status", "origen_propiedad", "aprobacion_status"]) {
    assert.ok(columnas.includes(columna), `la política de publicación necesita ${columna}`);
  }
});

test("/user: del asesor y del sitio sólo lo que el sitio muestra; nada interno ni la llave", () => {
  const fuente = leer("app/api/cbf/user/route.ts");
  const columnasDe = (tabla) => {
    const select = fuente.match(new RegExp(`from\\("${tabla}"\\)\\s*\\.select\\("([^"]+)"\\)`));
    assert.ok(select, `${tabla} sin select explícito`);
    return new Set(select[1].split(",").map((c) => c.trim()));
  };
  assert.deepEqual(columnasDe("usuarios"), new Set([
    "id", "nombre_usuario", "email_usuario", "telefono_usuario", "imagen_perfil_usuario", "actividad_usuario",
  ]), "los sitios leen estas (WhatsApp, contacto, foto, actividad); subject_ref, términos u organización no salen");
  assert.deepEqual(columnasDe("user_sites"), new Set(["site_name", "theme_config"]),
    "los sitios leen el nombre y el logo; Stripe, plan, orden, ciclo de vida o la llave no salen");
  assert.match(fuente, /platform_config: \{\s*mapbox_token:/, "el token de mapa lo arma CBF, no sale de la fila");
});

function archivosDeRuta(directorio) {
  return readdirSync(new URL(`../${directorio}`, import.meta.url), { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) return archivosDeRuta(ruta);
    return entrada.name === "route.ts" ? [ruta] : [];
  });
}

test("admin e internal no aceptan la llave del sitio", () => {
  for (const ruta of [...archivosDeRuta("app/api/cbf/admin"), ...archivosDeRuta("src/app/api/cbf/admin"), ...archivosDeRuta("app/api/internal")]) {
    const fuente = leer(ruta);
    assert.doesNotMatch(fuente, /authMiddleware\(|verifyApiKey\(/, `${ruta} aceptaría la llave pública`);
  }
  for (const ruta of archivosDeRuta("app/api/internal")) {
    assert.match(leer(ruta), /hasInternalCredential\(request, "CBF_[A-Z_]+_KEY"\)/, `${ruta}: credencial interna`);
  }
  for (const ruta of archivosDeRuta("app/api/cbf/admin")) {
    assert.match(leer(ruta), /status: 410/, `${ruta}: retirada`);
  }
});
