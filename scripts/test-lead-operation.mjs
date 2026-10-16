import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { conOperacionPublicada, leerIdPropiedad, resolverOperacionDelLead } from "../lib/lead-operation.ts";

/*
 * HPY-205 — por qué importa:
 *
 * Este endpoint escribía "Comprar" para todo lo que no fuera "renta" y no guardaba de qué propiedad
 * nacía el lead. Una unidad en Aportación o Inversión llegaba al CRM como una compra genérica, y el
 * asesor no sabía sobre qué inmueble le escribían. El owner pide tres datos distinguibles: la unidad
 * seleccionada, la operación que publica y la intención que declara el interesado. Si alguien vuelve
 * a fundir cualquiera de los tres con otro, esto falla.
 */

test("con inmueble, la operación publicada y la intención declarada quedan separadas", () => {
  const r = resolverOperacionDelLead({ leadKind: "buyer", propiedad: { id_tipo_accion: 2 }, tipoOperacionDelFormulario: "compra" });
  assert.deepEqual(r, { idAccionPropiedad: 2, idAccionPublicada: 2, intencionDeclarada: "compra", tipoOperacionLegacy: "Comprar", siteIntent: "buyer" },
    "se anuncia en renta y el interesado quiere comprar: no se corrige ninguno de los dos");
  assert.equal(resolverOperacionDelLead({ propiedad: { id_tipo_accion: 7 }, tipoOperacionDelFormulario: "renta" }).idAccionPublicada, 7,
    "Inversión sigue siendo Inversión aunque la intención sea rentar");
  assert.equal(resolverOperacionDelLead({ propiedad: { id_tipo_accion: 5 } }).idAccionPropiedad, 5, "Aportación no se vuelve compra");
});

test("sin intención declarada no se inventa una: site_intent queda null y el enum legacy sólo proyecta", () => {
  for (const leadKind of ["buyer", "renter", undefined]) {
    const r = resolverOperacionDelLead({ leadKind, propiedad: { id_tipo_accion: 2 } });
    assert.equal(r.intencionDeclarada, null);
    assert.equal(r.siteIntent, null, `lead_kind ${leadKind} no es una intención elegida por el interesado`);
    assert.equal(r.tipoOperacionLegacy, "Rentar", "el enum legacy se proyecta como en la Suite (2 → Rentar)");
  }
});

test("una propiedad sin operación queda desconocida, no se vuelve compra", () => {
  assert.equal(resolverOperacionDelLead({ propiedad: { id_tipo_accion: null } }).idAccionPublicada, null);
});

test("búsqueda general: sin inmueble, sólo vale lo que el interesado declaró", () => {
  assert.equal(resolverOperacionDelLead({ tipoOperacionDelFormulario: "compra" }).idAccionPropiedad, 1);
  const renta = resolverOperacionDelLead({ tipoOperacionDelFormulario: " Renta " });
  assert.deepEqual([renta.idAccionPropiedad, renta.idAccionPublicada, renta.siteIntent], [2, null, "renter"]);
  for (const valor of ["inversion", "aportacion", undefined, 7]) {
    assert.equal(resolverOperacionDelLead({ tipoOperacionDelFormulario: valor }).idAccionPropiedad, null);
  }
});

test("la captación de propietarios es otro flujo: sin ficha, sin operación ni intención de compra", () => {
  const r = resolverOperacionDelLead({ leadKind: "seller", tipoOperacionDelFormulario: "compra" });
  assert.deepEqual([r.idAccionPropiedad, r.idAccionPublicada, r.intencionDeclarada, r.siteIntent], [null, null, null, "seller"]);
});

test("id_propiedad: ausente no es inválido, y un valor que no es id se rechaza", () => {
  assert.equal(leerIdPropiedad(undefined), undefined);
  assert.equal(leerIdPropiedad(""), undefined);
  assert.equal(leerIdPropiedad("42"), 42);
  assert.equal(leerIdPropiedad(-1), null);
  assert.equal(leerIdPropiedad("abc"), null);
});

test("el sitio recibe la operación publicada con el nombre del catálogo, o null; nunca «Venta» por omisión", () => {
  const catalogo = [{ id: 1, nombre: "Compra-venta", codigo: "sale" }, { id: 7, nombre: "Inversión", codigo: "investment" }];
  const filas = conOperacionPublicada([{ id: 1, id_tipo_accion: 7 }, { id: 2, id_tipo_accion: 9 }, { id: 3, id_tipo_accion: null }], catalogo);
  assert.deepEqual(filas.map((f) => f.operacion_publicada?.nombre ?? null), ["Inversión", null, null]);
});

test("HPY-206: el precio publicado lleva su periodo; una renta es mensual y una venta, precio total", () => {
  const catalogo = [{ id: 1, nombre: "Compra-venta", codigo: "sale" }, { id: 2, nombre: "Renta", codigo: "rent" }];
  const filas = conOperacionPublicada([{ id: 1, id_tipo_accion: 2 }, { id: 2, id_tipo_accion: 1 }, { id: 3, id_tipo_accion: null }, { id: 4, id_tipo_accion: "2" }], catalogo);
  assert.deepEqual(filas.map((f) => f.precio_periodo), ["mensual", null, null, "mensual"],
    "sin operación no se inventa periodo; el sitio no lo infiere por su cuenta");
});

test("la ruta guarda los tres datos, liga sólo propiedades del sitio y no liga la captación a una ficha", () => {
  const route = readFileSync(new URL("../app/api/cbf/leads/route.ts", import.meta.url), "utf8");
  assert.match(route, /id_accion_propiedad: operacion\.idAccionPropiedad,/);
  assert.match(route, /id_propiedad: propiedad\?\.id \?\? null,/);
  assert.match(route, /site_intent: siteIntent,/);
  assert.match(route, /\.in\("id_usuario", await getInventoryUserIds\(authResult\)\)/);
  assert.match(route, /lead_kind === "seller" && idPropiedad !== undefined/);
  assert.match(route, /if \(!enCatalogo\) propiedad = \{ \.\.\.data, id_tipo_accion: null \};/,
    "una operación fuera del catálogo no tumba el insert (FK de solicitudes.id_accion_propiedad): el lead no se pierde");
  assert.doesNotMatch(route, /tipo_operacion === "renta" \? "Rentar" : "Comprar"/);
});
