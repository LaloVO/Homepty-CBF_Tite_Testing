import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");

/*
 * HPY-216 (estatuto de borrado de la Suite, enmienda del 2026-11-06). Por qué importa: `POST /api/cbf/leads` escribe la solicitud,
 * después la referencia de cada documento (la tabla que el estatuto extrae del día 30 al 90 y purga el día 90) y sólo al final avisa
 * al asesor. Si las referencias no se guardan, la solicitud se borra y el sitio recibe 500 para volver a mandarla. Estas pruebas fallan
 * si el asesor recibe el aviso de una solicitud que ya no existe, si una solicitud sin documentos depende de la tabla nueva (antes de
 * la migración la perdería con un 500, y la de un sitio de antes también) o si una solicitud cuyas referencias fallaron se queda viva
 * con sus documentos fuera del estatuto.
 *
 * Corre la ruta real con lib/site-files, lib/site-files-server y lib/lead-operation reales y el constructor de consultas real de
 * supabase-js. Sólo son de mentira la autenticación del sitio (un módulo que devuelve su contexto) y el transporte: ningún .env,
 * credencial, base ni servidor.
 */

const PROYECTO = "https://fixture.supabase.co";
const SITIO = "52a40ed8-afe3-4a9a-976c-735d2ae93406";
const ASESOR = "6f1c0d3e-0000-4000-8000-0000000000a5";
const UUID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const SOLICITUD = 7001;
const RUTA_INE = `sitios/${SITIO}/${UUID}/ine.pdf`;
const URL_DE_ANTES = `${PROYECTO}/storage/v1/object/public/documentos-leads/leads/ana_example_test/identificacion/1730000000000_ine.pdf`;

function loadModule(relativePath, dependencies) {
  const file = new URL(`../${relativePath}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, URL,
    require: (name) => dependencies[name] ?? require(name),
    process: { env: {} },
    console: { error() {}, warn() {}, log() {} },
  }, { filename: file.pathname });
  return module.exports;
}

const json = (cuerpo, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

/**
 * `referencias`: "ok", o "falta" (la respuesta de PostgREST cuando la tabla no existe: CBF nuevo antes de la migración).
 * `deshacer`: "ok" o "falla" (el borrado de la solicitud no se puede hacer).
 */
function harness({ referencias = "ok", deshacer = "ok" } = {}) {
  const peticiones = [];
  const client = createClient(PROYECTO, "fixture-service-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, init = {}) => {
      const query = new URL(url);
      const metodo = (init.method ?? "GET").toUpperCase();
      if (query.pathname.startsWith("/storage/v1/object/")) {
        peticiones.push({ metodo, objeto: decodeURIComponent(query.pathname.slice("/storage/v1/object/".length)) });
        return new Response(null, { status: metodo === "HEAD" ? 200 : 405 });
      }
      const tabla = query.pathname.split("/").at(-1);
      const cuerpo = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      peticiones.push({ metodo, tabla, id: query.searchParams.get("id"), cuerpo });
      if (metodo === "GET") return json([]); // ubicación del perfil: sin coincidencia, se quedan los valores por defecto
      if (metodo === "POST" && tabla === "solicitudes") {
        return json({ id: SOLICITUD, nombre_contacto: cuerpo.nombre_contacto, correo_contacto: cuerpo.correo_contacto }, 201);
      }
      if (metodo === "POST" && tabla === "solicitud_documentos_de_sitio") {
        return referencias === "ok" ? new Response(null, { status: 201 })
          : json({ code: "PGRST205", message: "Could not find the table 'public.solicitud_documentos_de_sitio' in the schema cache" }, 404);
      }
      if (metodo === "DELETE" && tabla === "solicitudes") {
        return deshacer === "ok" ? new Response(null, { status: 204 })
          : json({ code: "57014", message: "canceling statement due to statement timeout" }, 500);
      }
      if (metodo === "POST" && tabla === "notifications") return new Response(null, { status: 201 });
      return json({ code: "fixture", message: `unexpected ${metodo} ${tabla}` }, 500); // la prueba lo ve en la lista de escrituras
    } },
  });
  const contexto = { siteId: SITIO, userId: ASESOR, organizationId: null, accessBasis: "legacy_grant" };
  const supabase = { supabase: client, supabaseUrl: PROYECTO };
  const { POST } = loadModule("app/api/cbf/leads/route.ts", {
    "next/server": { NextRequest, NextResponse },
    "@/lib/auth": { authMiddleware: async () => contexto, getInventoryUserIds: async () => [ASESOR] },
    "@/lib/lead-operation": loadModule("lib/lead-operation.ts", {}),
    "@/lib/site-files": loadModule("lib/site-files.ts", {}),
    "@/lib/site-files-server": loadModule("lib/site-files-server.ts", { "@/lib/supabase": supabase }),
    "@/lib/supabase": supabase,
  });
  const escrituras = () => peticiones.filter((p) => p.metodo !== "GET" && p.metodo !== "HEAD")
    .map((p) => `${p.metodo} ${p.tabla}${p.metodo === "DELETE" ? ` ${p.id}` : ""}`);
  return {
    peticiones,
    escrituras,
    enviar: (campos) => POST(new NextRequest("https://site.example.test/api/cbf/leads", {
      method: "POST",
      headers: { Authorization: "Bearer cbf_live_fixture", "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_completo: "Ana de Prueba", email: "Ana@Example.test", telefono: "5500000000", tipo_operacion: "compra",
        tipo_propiedad: "casa", documentos_disponibles: ["identificacion"],
        consent: { version: "2026-10", acceptedAt: "2026-11-06T00:00:00.000Z" }, ...campos,
      }),
    })),
  };
}

test("lead route: an undone lead never notifies the advisor; a kept one notifies only after its references are saved", async () => {
  const guardada = harness();
  const respuesta = await guardada.enviar({ documentos: { identificacion: RUTA_INE } });
  assert.equal(respuesta.status, 201);
  assert.deepEqual(guardada.escrituras(), ["POST solicitudes", "POST solicitud_documentos_de_sitio", "POST notifications"],
    "the request, then its references, then the advisor's notification");
  assert.deepEqual(guardada.peticiones.find((p) => p.tabla === "solicitud_documentos_de_sitio").cuerpo, [{
    solicitud_id: SOLICITUD, site_id: SITIO, tipo_documento: "identificacion",
    file_url: `${PROYECTO}/storage/v1/object/public/documentos-leads/${RUTA_INE}`,
  }], "one reference per document, with the token's site and the object URL the Suite reads");

  const deshecha = harness({ referencias: "falta" });
  assert.equal((await deshecha.enviar({ documentos: { identificacion: RUTA_INE } })).status, 500);
  assert.equal(deshecha.peticiones.some((p) => p.tabla === "notifications"), false, "no notification for a request that no longer exists");
});

test("lead route: a lead without documents writes no reference, even from a site that still uploads with the public key", async () => {
  const casos = [["no files", {}], ["documentos_urls of an older site", { documentos_urls: { identificacion: URL_DE_ANTES } }]];
  for (const [caso, campos] of casos) {
    // The reference table is missing (CBF deployed before the migration): a lead without documents must not notice.
    const api = harness({ referencias: "falta" });
    const respuesta = await api.enviar(campos);
    assert.equal(respuesta.status, 201, caso);
    assert.deepEqual(api.escrituras(), ["POST solicitudes", "POST notifications"], `${caso}: nothing else is written`);
    assert.equal(api.peticiones.some((p) => p.objeto !== undefined), false, `${caso}: no upload to verify`);
    if (campos.documentos_urls) {
      const solicitud = api.peticiones.find((p) => p.metodo === "POST" && p.tabla === "solicitudes").cuerpo;
      assert.ok(solicitud.detalles_adicionales.includes(URL_DE_ANTES), "the older site's link stays in the request's text for the advisor");
    }
  }
});

test("lead route: a lead whose references fail answers 500 and deletes its request", async () => {
  const api = harness({ referencias: "falta" });
  const respuesta = await api.enviar({ documentos: { identificacion: RUTA_INE } });
  assert.equal(respuesta.status, 500);
  assert.deepEqual(await respuesta.json(), { error: "No fue posible registrar los documentos de la solicitud: vuelve a enviarla" });
  assert.deepEqual(api.escrituras(), ["POST solicitudes", "POST solicitud_documentos_de_sitio", `DELETE solicitudes eq.${SOLICITUD}`],
    "the request just inserted is deleted (its references go with it in cascade)");
  assert.deepEqual(api.peticiones.filter((p) => p.metodo === "HEAD").map((p) => p.objeto), [`documentos-leads/${RUTA_INE}`],
    "the upload was verified before anything was written");

  const sinDeshacer = harness({ referencias: "falta", deshacer: "falla" });
  const respuestaSinDeshacer = await sinDeshacer.enviar({ documentos: { identificacion: RUTA_INE } });
  assert.equal(respuestaSinDeshacer.status, 500, "even if the undo fails, the site gets the error");
  assert.deepEqual(sinDeshacer.escrituras(), ["POST solicitudes", "POST solicitud_documentos_de_sitio", `DELETE solicitudes eq.${SOLICITUD}`],
    "no notification either");
});
