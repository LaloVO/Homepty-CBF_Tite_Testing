import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { leerIdPropiedad, resolverOperacionDelLead } from "../lib/lead-operation.ts";

/*
 * HPY-205 — por qué importa:
 *
 * Este endpoint escribía "Comprar" para todo lo que no fuera "renta" y no guardaba de qué
 * propiedad nacía el lead. Una unidad en Aportación o Inversión llegaba al CRM como una compra
 * genérica, y el asesor no sabía sobre qué inmueble le escribían. La regla del ecosistema es que
 * la operación de la unidad no colapsa y que su referencia viaja con el lead. Si alguien vuelve a
 * derivar la operación del formulario cuando hay propiedad, o a convertir lo desconocido en
 * compra, esto falla.
 */

test("con propiedad, manda la operación de la propiedad aunque el formulario diga otra cosa", () => {
  assert.deepEqual(
    resolverOperacionDelLead({ conPropiedad: true, idTipoAccionDePropiedad: 7, tipoOperacionDelFormulario: "compra" }),
    { idAccionPropiedad: 7, tipoOperacionLegacy: "Comprar" },
  );
  assert.deepEqual(
    resolverOperacionDelLead({ conPropiedad: true, idTipoAccionDePropiedad: 2, tipoOperacionDelFormulario: "compra" }),
    { idAccionPropiedad: 2, tipoOperacionLegacy: "Rentar" },
  );
  assert.equal(resolverOperacionDelLead({ conPropiedad: true, idTipoAccionDePropiedad: 5 }).idAccionPropiedad, 5);
});

test("una propiedad sin operación queda desconocida, no se vuelve compra", () => {
  assert.equal(resolverOperacionDelLead({ conPropiedad: true, idTipoAccionDePropiedad: null }).idAccionPropiedad, null);
});

test("sin propiedad, el formulario sólo puede decir compra o renta; lo demás queda desconocido", () => {
  assert.equal(resolverOperacionDelLead({ conPropiedad: false, tipoOperacionDelFormulario: "compra" }).idAccionPropiedad, 1);
  assert.equal(resolverOperacionDelLead({ conPropiedad: false, tipoOperacionDelFormulario: " Renta " }).idAccionPropiedad, 2);
  for (const valor of ["inversion", "aportacion", undefined, 7]) {
    assert.equal(resolverOperacionDelLead({ conPropiedad: false, tipoOperacionDelFormulario: valor }).idAccionPropiedad, null);
  }
});

test("id_propiedad: ausente no es inválido, y un valor que no es id se rechaza", () => {
  assert.equal(leerIdPropiedad(undefined), undefined);
  assert.equal(leerIdPropiedad(""), undefined);
  assert.equal(leerIdPropiedad("42"), 42);
  assert.equal(leerIdPropiedad(-1), null);
  assert.equal(leerIdPropiedad("abc"), null);
});

test("la ruta guarda la operación y la propiedad, y sólo acepta propiedades del inventario del sitio", () => {
  const route = readFileSync(new URL("../app/api/cbf/leads/route.ts", import.meta.url), "utf8");
  assert.match(route, /id_accion_propiedad: operacion\.idAccionPropiedad,/);
  assert.match(route, /id_propiedad: propiedad\?\.id \?\? null,/);
  assert.match(route, /\.in\("id_usuario", await getInventoryUserIds\(authResult\)\)/);
  assert.doesNotMatch(route, /tipo_operacion === "renta" \? "Rentar" : "Comprar"/);
});
