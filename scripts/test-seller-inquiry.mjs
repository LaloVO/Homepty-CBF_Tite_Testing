import assert from "node:assert/strict";
import test from "node:test";

import { leerConsultaDeCatalogo } from "../lib/site-catalogs.ts";
import { leerCaptacion } from "../lib/seller-inquiry.ts";

/*
 * Por qué importa (owner, 2026-10-16): la captación ya no la escribe el sitio con la llave anónima;
 * la manda a CBF y CBF la guarda a nombre del asesor del sitio. Antes una llave de más (la operación,
 * sin columna) tumbaba la fila entera y la captación se perdía, y cualquiera con la llave anónima
 * podía dejar captaciones a nombre de cualquier asesor. Estas pruebas fallan si el cuerpo vuelve a
 * decidir el asesor, si una llave desconocida vuelve a tirar la captación o si se acepta un archivo
 * que CBF no autorizó.
 */

const RUTA_OK = "sitios/52a40ed8-afe3-4a9a-976c-735d2ae93406/0f8fad5b-d9cb-469f-a165-70867728950e/sala.jpg";
const rutaValida = (ruta) => ruta === RUTA_OK;
const CONTACTO = { nombre_completo: "  Ana Pérez ", email: "ANA@EJEMPLO.MX", telefono: "8440000000" };

test("el asesor no sale del cuerpo y las llaves desconocidas se ignoran", () => {
  const r = leerCaptacion({ ...CONTACTO, advisor_user_id: "otro-asesor", status: "completada", columna_que_no_existe: 1 }, { rutaValida });
  assert.equal(r.ok, true);
  assert.deepEqual(r.captacion.fila, { nombre_completo: "Ana Pérez", email: "ana@ejemplo.mx", telefono: "8440000000", es_herencia: false });
});

test("la operación que quiere el propietario viaja como id del catálogo", () => {
  const r = leerCaptacion({ ...CONTACTO, id_tipo_accion: "3", id_tipo_propiedad: 1, precio_propiedad: "2,500,000", banios_propiedad: 2.5 }, { rutaValida });
  assert.equal(r.captacion.fila.id_tipo_accion, 3, "Traspaso no se vuelve venta ni se pierde");
  assert.equal(r.captacion.fila.precio_propiedad, 2500000);
  assert.equal(r.captacion.fila.banios_propiedad, 2.5);
  for (const malo of [0, -1, 1.5, "venta"]) {
    assert.equal(leerCaptacion({ ...CONTACTO, id_tipo_accion: malo }, { rutaValida }).ok, false, `id_tipo_accion ${malo}`);
  }
});

test("sin contacto no hay captación", () => {
  assert.equal(leerCaptacion({ nombre_completo: "Ana", email: "", telefono: "1" }, { rutaValida }).ok, false);
  assert.equal(leerCaptacion(null, { rutaValida }).ok, false);
});

test("fotos y documentos sólo con rutas que CBF emitió para este sitio", () => {
  const r = leerCaptacion({
    ...CONTACTO,
    imagenes: [{ path: RUTA_OK, nombre_imagen: "sala.jpg" }],
    documentos: [{ path: RUTA_OK, nombre_documento: "Escrituras", required: true }],
    amenidades: [3, "3", 7],
  }, { rutaValida });
  assert.deepEqual(r.captacion.imagenes, [{ ruta: RUTA_OK, nombre_imagen: "sala.jpg", orden: 0 }]);
  assert.deepEqual(r.captacion.documentos, [{ ruta: RUTA_OK, nombre_documento: "Escrituras", required: true }]);
  assert.deepEqual(r.captacion.amenidades, [3, 7], "sin repetidos");

  assert.equal(leerCaptacion({ ...CONTACTO, imagenes: [{ path: "https://otro.host/foto.jpg" }] }, { rutaValida }).ok, false);
  assert.equal(leerCaptacion({ ...CONTACTO, documentos: [{ path: RUTA_OK }] }, { rutaValida }).ok, false, "un documento sin nombre no se guarda");
  assert.equal(leerCaptacion({ ...CONTACTO, amenidades: ["piscina"] }, { rutaValida }).ok, false);
});

test("catálogos: sólo los conocidos; ciudades siempre por estado", () => {
  assert.equal(leerConsultaDeCatalogo("operaciones", new URLSearchParams()).tabla, "accionespropiedades");
  assert.equal(leerConsultaDeCatalogo("ciudades", new URLSearchParams("id_estado=5")).idEstado, 5);
  assert.equal(leerConsultaDeCatalogo("ciudades", new URLSearchParams()).status, 400, "no se descarga el país entero");
  assert.equal(leerConsultaDeCatalogo("usuarios", new URLSearchParams()).status, 404, "no es un proxy a cualquier tabla");
  assert.equal(leerConsultaDeCatalogo("constructor", new URLSearchParams()).status, 404);
});
