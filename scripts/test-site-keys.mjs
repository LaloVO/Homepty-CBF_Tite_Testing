import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

// Rotar las llaves de los sitios sin cortar ninguno (owner, entrada 104, decisión 3: «siempre y cuando garantices que no haya efectos
// colaterales a los sitios satélites»). La llave viaja en el bundle de cada sitio, así que cambiarla es cambiar la variable de su
// despliegue y redesplegarlo: mientras eso pasa, la vieja y la nueva tienen que servir las dos, y la vieja sólo deja de servir con un paso
// explícito, cuando su último uso se detuvo. Si una prueba falla, una rotación apaga un sitio, una llave retirada sigue sirviendo o se
// distingue de una desconocida (su 401, su cuerpo o sus viajes a la base dirían que ese sitio existió), el uso de una llave no queda
// anotado (y nadie sabría cuándo retirarla), o la llave vuelve a viajar en claro a la base y a sus registros. Corren los módulos reales
// (lib/auth.ts, lib/site-keys.ts, /api/cbf/user y /api/cbf/analytics/track) con el constructor de consultas real de supabase-js; sólo el
// transporte es de mentira.

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
const ROOT = new URL("../", import.meta.url);
const huella = (llave) => createHash("sha256").update(llave).digest("hex");

function loadModule(relativePath, dependencies) {
  const file = new URL(relativePath, ROOT);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file.pathname,
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, URL, Response,
    require: (name) => dependencies[name] ?? require(name),
    process: { env: {} },
    console: { error() {}, warn() {}, log() {} },
  }, { filename: file.pathname });
  return module.exports;
}

const OWNER = "00000000-0000-4000-8000-00000000000b";
const VIEJA = "cbf_live_fixture_vieja-0123456789";
const NUEVA = "cbf_live_fixture_nueva_abcdefghij";
const SITE = { id: "00000000-0000-4000-8000-0000000051b0", user_id_supabase: OWNER, organization_id: null, is_active: true,
  lifecycle_status: "pending", site_name: "Beto Bravo Inmuebles", theme_config: { primaryColor: "#0a2540" } };
const PROFILE = { id: OWNER, nombre_usuario: "Beto Bravo", email_usuario: "beto@example.test", telefono_usuario: "5500000000",
  imagen_perfil_usuario: null, actividad_usuario: "Asesor", banner_usuario: null, descripcion_usuario: null, actividades: [],
  actividad_claves: [], servicios: null, como_trabaja: null, id_estado: null, id_ciudad: null, estados: null, ciudades: null };

/**
 * La base vista por CBF con las llaves del sitio en `site_api_keys` (por su huella): `llaves` es { huella → { id, retired_at } }.
 * Anota cada petición (con su nivel de viaje) y cada escritura.
 */
function base(llaves) {
  const requests = [];
  const writes = [];
  let respondidas = 0;
  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
  const client = createClient("https://fixture.invalid", "fixture-service-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, init = {}) => {
      const query = new URL(url);
      const method = (init.method ?? "GET").toUpperCase();
      const body = typeof init.body === "string" ? JSON.parse(init.body) : null;
      requests.push({ url: String(url), path: query.pathname, method, params: Object.fromEntries(query.searchParams), body,
        nivel: respondidas });
      await new Promise((r) => setTimeout(r, 1));
      respondidas += 1;
      const table = query.pathname.split("/").at(-1);
      const p = query.searchParams;
      if (query.pathname.endsWith("/rpc/usuario_eliminado")) return json(false);
      if (method !== "GET") {
        writes.push({ method, table, params: Object.fromEntries(p), body });
        return new Response(null, { status: 204 });
      }
      if (table === "site_api_keys") {
        const fila = llaves[(p.get("key_sha256") ?? "").replace(/^eq\./, "")];
        return json(fila ? [{ ...fila, site: SITE }] : []);
      }
      if (table === "commercial_entitlement_grants") return json([{ valid_from: "2026-08-13T00:00:00Z", valid_until: null, revoked_at: null }]);
      if (table === "usuarios") return json(PROFILE);
      if (table === "user_sites") return json({ site_name: SITE.site_name, theme_config: SITE.theme_config });
      throw new Error(`fixture: tabla inesperada ${table}`);
    } },
  });
  return { client, requests, writes };
}

function cbf(llaves) {
  const db = base(llaves);
  const supabaseMod = { supabase: db.client, supabaseUrl: "https://fixture.invalid" };
  const despues = [];
  const access = loadModule("lib/site-runtime-access.ts", {});
  const owner = loadModule("lib/site-owner.ts", { "./supabase": supabaseMod });
  const keys = loadModule("lib/site-keys.ts", { "next/server": { after: (tarea) => despues.push(tarea) }, "./supabase": supabaseMod });
  const auth = loadModule("lib/auth.ts", { "next/server": { NextResponse }, "./supabase": supabaseMod, "./site-runtime-access": access,
    "./site-owner": owner, "./site-keys": keys });
  const user = loadModule("app/api/cbf/user/route.ts", { "next/server": { NextRequest, NextResponse }, "@/lib/auth": auth,
    "@/lib/supabase": supabaseMod });
  const track = loadModule("app/api/cbf/analytics/track/route.ts", { "next/server": { NextRequest, NextResponse },
    "@/lib/supabase": supabaseMod, "@/lib/site-owner": owner, "@/lib/site-keys": keys });
  const pedir = (llave) => user.GET(new NextRequest("https://site.example.test/api/cbf/user", { headers: { Authorization: `Bearer ${llave}` } }));
  const visitar = (llave) => track.POST(new NextRequest(`https://cbf.example.test/api/cbf/analytics/track?key=${llave}&path=%2F&sw=390`,
    { method: "POST" }));
  /** Corre lo que `after` dejó para después de responder. */
  const terminar = async () => { while (despues.length) await despues.shift()(); };
  return { ...db, despues, pedir, visitar, terminar };
}
const respuesta = async (res) => ({ status: res.status, body: await res.text() });
const viajes = (requests) => Math.max(...requests.map((r) => r.nivel)) + 1;
const activas = () => ({ [huella(VIEJA)]: { id: "llave-vieja", retired_at: null }, [huella(NUEVA)]: { id: "llave-nueva", retired_at: null } });

test("mientras el sitio rota, la llave vieja y la nueva entregan lo mismo: su despliegue puede cambiar sin un solo 401", async () => {
  const vistas = [];
  for (const llave of [VIEJA, NUEVA]) {
    const sitio = cbf(activas());
    const res = await sitio.pedir(llave);
    assert.equal(res.status, 200, llave === VIEJA ? "la vieja sigue" : "la nueva ya sirve");
    vistas.push({ cuerpo: await res.text(), consultas: sitio.requests.map((r) => r.path.split("/").at(-1)) });
  }
  assert.deepEqual(vistas[0], vistas[1], "el mismo perfil y las mismas consultas con cualquiera de las dos");
  assert.equal(JSON.parse(vistas[0].cuerpo).data.user.nombre_usuario, "Beto Bravo");
});

test("una llave retirada se rechaza igual que una desconocida: mismo 401, mismo cuerpo y un solo viaje; su intento se anota después de responder", async () => {
  const llaves = { ...activas(), [huella(VIEJA)]: { id: "llave-vieja", retired_at: "2026-11-20T00:00:00Z" } };
  const desconocida = cbf(llaves);
  const r1 = await respuesta(await desconocida.pedir("cbf_live_fixture_nadie_000000000"));
  const retirada = cbf(llaves);
  const r2 = await respuesta(await retirada.pedir(VIEJA));
  assert.equal(r1.status, 401);
  assert.deepEqual(r2, r1, "nada en la respuesta dice que esa llave existió");
  assert.deepEqual([viajes(desconocida.requests), viajes(retirada.requests)], [1, 1], "ni en sus viajes a la base");
  assert.equal(retirada.requests.some((r) => r.path.endsWith("/usuarios")), false, "el perfil no se lee");
  assert.deepEqual(retirada.writes, [], "la anotación no va antes de responder");
  await retirada.terminar();
  assert.deepEqual(retirada.writes.map((w) => [w.method, w.table, Object.keys(w.body)]), [["PATCH", "site_api_keys", ["last_refused_at"]]]);
  assert.equal(retirada.writes[0].params.id, "eq.llave-vieja");
  await desconocida.terminar();
  assert.deepEqual(desconocida.writes, [], "de una desconocida no hay nada que anotar");
});

test("el uso de una llave admitida se anota después de responder, a lo más una vez cada cinco minutos, y nunca cambia la respuesta", async () => {
  const sitio = cbf(activas());
  const res = await sitio.pedir(NUEVA);
  assert.equal(res.status, 200);
  assert.deepEqual(sitio.writes, [], "la respuesta no espera la anotación");
  await sitio.terminar();
  assert.equal(sitio.writes.length, 1);
  const [w] = sitio.writes;
  assert.deepEqual([w.method, w.table, Object.keys(w.body), w.params.id], ["PATCH", "site_api_keys", ["last_used_at"], "eq.llave-nueva"]);
  assert.match(w.params.or, /^\(last_used_at\.is\.null,last_used_at\.lt\.\d{4}-\d{2}-\d{2}T/, "el filtro de cinco minutos va en la consulta");
  const corte = Date.parse(w.params.or.match(/lt\.([^)]+)\)/)[1]);
  assert.ok(Math.abs(Date.now() - 5 * 60 * 1000 - corte) < 60 * 1000, "el corte es hace cinco minutos");
});

test("la llave nunca viaja en claro a la base: sólo su sha256 (los registros de Supabase guardaban cada llave en la búsqueda)", async () => {
  for (const hacer of [(s) => s.pedir(NUEVA), (s) => s.visitar(NUEVA), (s) => s.pedir(VIEJA)]) {
    const sitio = cbf(activas());
    await hacer(sitio);
    await sitio.terminar();
    const todo = JSON.stringify(sitio.requests) + JSON.stringify(sitio.writes);
    assert.equal(todo.includes("cbf_live_fixture"), false);
    assert.ok(sitio.requests.some((r) => r.params.key_sha256 === `eq.${huella(NUEVA)}` || r.params.key_sha256 === `eq.${huella(VIEJA)}`));
  }
});

test("la visita con una llave retirada no se registra, como la de una desconocida; con una activa se registra y anota su uso", async () => {
  const llaves = { ...activas(), [huella(VIEJA)]: { id: "llave-vieja", retired_at: "2026-11-20T00:00:00Z" } };
  const vieja = cbf(llaves);
  assert.deepEqual(await respuesta(await vieja.visitar(VIEJA)), { status: 200, body: "" });
  await vieja.terminar();
  assert.deepEqual(vieja.writes.map((w) => [w.table, Object.keys(w.body ?? {})]), [["site_api_keys", ["last_refused_at"]]],
    "no hay visita; sólo el intento con la retirada");
  const nueva = cbf(llaves);
  assert.deepEqual(await respuesta(await nueva.visitar(NUEVA)), { status: 200, body: "" });
  await nueva.terminar();
  assert.deepEqual(nueva.writes.map((w) => w.table), ["analytics_events", "site_api_keys"]);
  assert.equal(nueva.writes[1].params.id, "eq.llave-nueva");
});

test("si anotar el uso no se puede programar, la llave se admite igual: anotar nunca decide la respuesta", async () => {
  const db = base(activas());
  const supabaseMod = { supabase: db.client, supabaseUrl: "https://fixture.invalid" };
  const keys = loadModule("lib/site-keys.ts", { "next/server": { after: () => { throw new Error("fuera de una petición"); } },
    "./supabase": supabaseMod });
  const auth = loadModule("lib/auth.ts", { "next/server": { NextResponse }, "./supabase": supabaseMod,
    "./site-runtime-access": loadModule("lib/site-runtime-access.ts", {}), "./site-owner": loadModule("lib/site-owner.ts", { "./supabase": supabaseMod }),
    "./site-keys": keys });
  const contexto = await auth.verifyApiKey(NUEVA);
  assert.equal(contexto?.siteId, SITE.id);
});
