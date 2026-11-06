import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

// HPY-216 (owner, entradas 92 y 102): «las cuentas también deben respetar el estatuto de borrado». Desde el día 0 de una cuenta (y
// para siempre después del 90) su sitio no se sirve: CBF le responde como a una llave desconocida, no registra sus visitas y no lo
// pinta; restaurar la cuenta lo devuelve sin que nada se reescriba. Lo dice la base (`usuario_eliminado`, que sólo el cliente de
// servicio llama). Si una de estas pruebas falla, el sitio de una cuenta eliminada sigue mostrando a su asesor, recibiendo solicitudes
// para una cuenta que ya no existe, o delata que su asesor se fue. Corren los módulos reales (auth, rutas, lib/db, la página) con el
// constructor de consultas real de supabase-js; sólo el transporte es de mentira: sin .env, sin base, sin servidor.

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
const ROOT = new URL("../", import.meta.url);

function loadModule(relativePath, dependencies) {
  const file = new URL(relativePath, ROOT);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
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
const KEY = "cbf_live_fixture_beto";
// Como los 11 sitios de producción (2026-11-06): pendientes, activos y admitidos por su contrato heredado.
const SITE = {
  id: "00000000-0000-4000-8000-0000000051b0", user_id_supabase: OWNER, organization_id: null, is_active: true,
  lifecycle_status: "pending", subdomain: "beto-bravo", custom_domain: "betobravo.mx", domain_verified: true,
  site_name: "Beto Bravo Inmuebles", theme_config: { primaryColor: "#0a2540" }, seo_config: { title: "Beto Bravo" },
};
const PROFILE = { id: OWNER, nombre_usuario: "Beto Bravo", email_usuario: "beto@example.test", telefono_usuario: "5500000000",
  imagen_perfil_usuario: "https://example.test/beto.jpg", actividad_usuario: "Asesor", banner_usuario: null, descripcion_usuario: null,
  actividades: ["Asesor"], actividad_claves: ["asesor"], servicios: null, como_trabaja: null, id_estado: 19, id_ciudad: 1039,
  estados: { nombre_estado: "Nuevo León" }, ciudades: { nombre_ciudad: "Monterrey" } };

/**
 * La base vista por CBF. `cuenta`: `viva`, `programada` (día 0 a 89), `anonimizada` (después del 90), `restaurada` (su fila de
 * `cuentas_en_eliminacion` se borró) o `sin_respuesta` (la base no contesta). Anota cada petición y cada escritura.
 */
function base({ cuenta = "viva", sitio = {}, contrato = true } = {}) {
  const requests = [];
  const writes = [];
  let respondidas = 0;
  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
  const noEncontrado = () => json({ code: "PGRST116", message: "fixture: 0 rows" }, 406);
  const client = createClient("https://fixture.invalid", "fixture-service-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, init = {}) => {
      const query = new URL(url);
      const method = (init.method ?? "GET").toUpperCase();
      const body = typeof init.body === "string" ? JSON.parse(init.body) : null;
      requests.push({ path: query.pathname, method, params: Object.fromEntries(query.searchParams), body, nivel: respondidas });
      await new Promise((r) => setTimeout(r, 1));
      respondidas += 1;
      const table = query.pathname.split("/").at(-1);
      if (query.pathname.endsWith("/rpc/usuario_eliminado")) {
        if (cuenta === "sin_respuesta") return json({ code: "57014", message: "fixture: canceling statement" }, 500);
        return json(body?.p_user === OWNER && ["programada", "anonimizada"].includes(cuenta));
      }
      if (method !== "GET") {
        writes.push(`${method} ${table}`);
        return new Response(null, { status: 201 });
      }
      const p = query.searchParams;
      if (table === "user_sites") {
        const coincide = p.get("cbf_api_key") === `eq.${KEY}` || p.get("custom_domain") === `eq.${SITE.custom_domain}`
          || p.get("subdomain") === `eq.${SITE.subdomain}` || p.get("id") === `eq.${SITE.id}`;
        if (!coincide) return noEncontrado();
        if (p.get("id") === `eq.${SITE.id}`) return json({ site_name: SITE.site_name, theme_config: SITE.theme_config });
        return json({ ...SITE, ...sitio });
      }
      if (table === "commercial_entitlement_grants") {
        return json(contrato && p.get("site_id") === `eq.${SITE.id}` ? [{ valid_from: "2026-08-13T00:00:00Z", valid_until: null, revoked_at: null }] : []);
      }
      if (table === "usuarios") return p.get("id") === `eq.${OWNER}` ? json(PROFILE) : noEncontrado();
      if (table === "propiedades") return json([]);
      throw new Error(`fixture: tabla inesperada ${table}`);
    } },
  });
  return { client, requests, writes };
}

/** Los módulos reales de CBF sobre esa base. */
function cbf(estado) {
  const db = base(estado);
  const supabaseMod = { supabase: db.client, supabaseUrl: "https://fixture.invalid" };
  const access = loadModule("lib/site-runtime-access.ts", {});
  const owner = loadModule("lib/site-owner.ts", { "./supabase": supabaseMod });
  const auth = loadModule("lib/auth.ts", { "next/server": { NextResponse }, "./supabase": supabaseMod, "./site-runtime-access": access,
    "./site-owner": owner });
  const publication = loadModule("lib/property-publication.ts", {});
  const user = loadModule("app/api/cbf/user/route.ts", { "next/server": { NextRequest, NextResponse }, "@/lib/auth": auth,
    "@/lib/supabase": supabaseMod });
  const track = loadModule("app/api/cbf/analytics/track/route.ts", { "next/server": { NextRequest, NextResponse },
    "@/lib/supabase": supabaseMod, "@/lib/site-owner": owner });
  const dbLib = loadModule("lib/db.ts", { "./supabase": supabaseMod, "./property-publication": publication, "./site-owner": owner });
  const NO_ENCONTRADO = new Error("NEXT_NOT_FOUND");
  const page = loadModule("src/app/sites/[subdomain]/page.tsx", {
    "next/navigation": { notFound: () => { throw NO_ENCONTRADO; } },
    "@/lib/supabase/server": { createClient: async () => db.client },
    "@/lib/property-publication": publication, "@/lib/site-owner": owner,
  });
  const pedir = (key = KEY) => user.GET(new NextRequest("https://site.example.test/api/cbf/user", { headers: { Authorization: `Bearer ${key}` } }));
  const visitar = (key = KEY) => track.POST(new NextRequest(`https://cbf.example.test/api/cbf/analytics/track?key=${key}&path=%2F&sw=390`,
    { method: "POST" }));
  const pintar = async (subdomain = SITE.subdomain) => {
    try {
      await page.default({ params: Promise.resolve({ subdomain }) });
      return "pintada";
    } catch (error) {
      if (error === NO_ENCONTRADO) return "no encontrada";
      throw error;
    }
  };
  return { ...db, auth, pedir, visitar, pintar, page, porDominio: (d) => dbLib.getSiteByDomain(d) };
}
const respuesta = async (res) => ({ status: res.status, body: await res.text() });

test("el sitio de una cuenta eliminada responde igual que una llave desconocida, del día 0 en adelante, y el perfil de su asesor no se lee", async () => {
  const desconocida = await respuesta(await cbf({ cuenta: "viva" }).pedir("cbf_live_fixture_nadie"));
  assert.equal(desconocida.status, 401);
  for (const cuenta of ["programada", "anonimizada"]) {
    const sitio = cbf({ cuenta });
    assert.deepEqual(await respuesta(await sitio.pedir()), desconocida, `${cuenta}: mismo 401, mismo mensaje`);
    assert.equal(sitio.requests.some((r) => r.path.endsWith("/usuarios")), false, `${cuenta}: el perfil de su asesor no se lee`);
    assert.equal(sitio.requests.some((r) => r.path.endsWith("/propiedades")), false);
    assert.deepEqual(sitio.writes, [], `${cuenta}: nada se escribe`);
  }
});

test("un sitio pendiente admitido por su contrato heredado (los 11 de producción) se rechaza con su cuenta y vuelve, sin escribir, al restaurarla", async () => {
  // Restaurar borra la fila de la cuenta en `cuentas_en_eliminacion`: `usuario_eliminado` vuelve a decir que no, y el sitio entrega
  // otra vez el perfil completo. Nada que CBF tenga que reescribir ni recordar.
  for (const [cuenta, status] of [["viva", 200], ["programada", 401], ["restaurada", 200]]) {
    const sitio = cbf({ cuenta });
    const res = await sitio.pedir();
    assert.equal(res.status, status, cuenta);
    if (status === 200) assert.equal((await res.json()).data.user.nombre_usuario, "Beto Bravo");
    assert.equal(sitio.requests.some((r) => r.path.endsWith("/commercial_entitlement_grants")), true, `${cuenta}: el contrato se sigue leyendo`);
    assert.deepEqual(sitio.writes, [], cuenta);
  }
});

test("pregunta por la cuenta dueña del sitio, con el cliente de servicio; si la base no contesta, el sitio no se sirve", async () => {
  const sitio = cbf({ cuenta: "viva" });
  await sitio.pedir();
  const preguntas = sitio.requests.filter((r) => r.path.endsWith("/rpc/usuario_eliminado"));
  assert.deepEqual(preguntas.map((r) => [r.method, r.body]), [["POST", { p_user: OWNER }]], "una vez, por su dueño (no por el sitio ni por la llave)");
  const desconocida = await respuesta(await cbf({ cuenta: "viva" }).pedir("cbf_live_fixture_nadie"));
  const caida = cbf({ cuenta: "sin_respuesta" });
  assert.deepEqual(await respuesta(await caida.pedir()), desconocida, "sin saber si la cuenta se eliminó, falla cerrado");
  assert.equal(caida.requests.some((r) => r.path.endsWith("/usuarios")), false);
});

test("la visita al sitio de una cuenta eliminada no se registra, como la de una llave desconocida; la de una cuenta viva, sí", async () => {
  for (const [cuenta, registrada] of [["viva", true], ["programada", false], ["anonimizada", false], ["sin_respuesta", false], ["restaurada", true]]) {
    const sitio = cbf({ cuenta });
    const res = await sitio.visitar();
    assert.deepEqual(await respuesta(res), { status: 200, body: "" }, cuenta);
    assert.deepEqual(sitio.writes, registrada ? ["POST analytics_events"] : [], cuenta);
  }
  const desconocida = cbf({ cuenta: "viva" });
  assert.deepEqual(await respuesta(await desconocida.visitar("cbf_live_fixture_nadie")), { status: 200, body: "" });
  assert.deepEqual(desconocida.writes, []);
});

test("la página raíz por dominio y la del subdominio no pintan el sitio de una cuenta eliminada: dicen lo mismo que de uno que no existe", async () => {
  for (const [cuenta, pinta] of [["viva", true], ["programada", false], ["anonimizada", false], ["sin_respuesta", false], ["restaurada", true]]) {
    const sitio = cbf({ cuenta });
    const config = await sitio.porDominio(SITE.custom_domain);
    assert.equal(config === null, !pinta, `${cuenta}: getSiteByDomain`);
    if (pinta) assert.equal(config.userId, OWNER);
    assert.equal(await sitio.pintar(), pinta ? "pintada" : "no encontrada", `${cuenta}: /sites/[subdomain]`);
    const titulo = (await sitio.page.generateMetadata({ params: Promise.resolve({ subdomain: SITE.subdomain }) })).title;
    assert.equal(titulo, pinta ? SITE.site_name : "Sitio no encontrado", `${cuenta}: el título no la nombra`);
    assert.deepEqual(sitio.writes, []);
  }
  assert.equal(await cbf({ cuenta: "viva" }).porDominio("nadie.mx"), null);
  assert.equal(await cbf({ cuenta: "viva" }).pintar("nadie"), "no encontrada");
});

test("un rechazo de una llave que nombra un sitio tarda los mismos viajes a la base sea cual sea el motivo: apagado, suspendido, sin contrato o de una cuenta eliminada", async () => {
  // El 401 y su cuerpo ya son los mismos. Si el número de viajes seguidos a la base (y con él el tiempo de la respuesta) dependiera
  // del motivo, la llave pública de un sitio, que viaja en su bundle, diría si su asesor eliminó su cuenta o sólo se apagó su sitio.
  // `nivel` es cuántas respuestas habían vuelto cuando salió cada petición: dos peticiones a la vez comparten nivel.
  const viajes = [];
  for (const estado of [{ sitio: { is_active: false } }, { sitio: { lifecycle_status: "suspended" } }, { contrato: false },
    { sitio: { lifecycle_status: "active" }, cuenta: "programada" }, { cuenta: "programada" }, { cuenta: "anonimizada" },
    { cuenta: "sin_respuesta" }]) {
    const s = cbf(estado);
    const res = await s.pedir();
    assert.equal(res.status, 401, JSON.stringify(estado));
    viajes.push(Math.max(...s.requests.map((r) => r.nivel)) + 1);
  }
  assert.deepEqual(viajes, Array(viajes.length).fill(2), String(viajes));
});

test("la visita que no se registra tarda lo mismo con el sitio apagado que con su cuenta eliminada", async () => {
  const viajes = [];
  for (const estado of [{ sitio: { is_active: false } }, { cuenta: "programada" }, { cuenta: "anonimizada" }]) {
    const s = cbf(estado);
    await s.visitar();
    assert.deepEqual(s.writes, [], JSON.stringify(estado));
    viajes.push(Math.max(...s.requests.map((r) => r.nivel)) + 1);
  }
  assert.deepEqual(viajes, [2, 2, 2], String(viajes));
});

// Lo que lee `user_sites` en CBF, y por qué cada lector deja o no deja pasar el sitio de una cuenta eliminada. Un lector nuevo tiene que
// entrar aquí: si admite o pinta un sitio, también pregunta por su cuenta.
const LECTORES = new Map([
  ["lib/auth.ts", "admite el sitio por su llave (toda ruta de /api/cbf pasa por authMiddleware)"],
  ["app/api/cbf/analytics/track/route.ts", "admite la visita por la llave"],
  ["lib/db.ts", "pinta el sitio de un dominio (app/page.tsx)"],
  ["src/app/sites/[subdomain]/page.tsx", "pinta el sitio de un subdominio"],
]);
const SIN_SITIO_QUE_ADMITIR = new Map([
  ["app/api/cbf/user/route.ts", "lee la configuración del sitio que authMiddleware ya admitió"],
  ["app/api/cbf/health/route.ts", "sólo comprueba que la base responde"],
  ["middleware.ts", "traduce un dominio verificado a su subdominio; no pinta nada (la ruta /sites/ de src/app no está en el build)"],
  ["app/api/internal/site-orders/[orderId]/provision/route.ts", "crea el sitio de una orden pagada (credencial interna)"],
  ["src/app/api/cbf/admin/add-custom-domain/route.ts", "administración con llave interna (fuera del build)"],
  ["src/app/api/cbf/admin/verify-domain/route.ts", "administración con llave interna (fuera del build)"],
]);
function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : archivos(path);
    return /\.(ts|tsx)$/.test(e.name) ? [path] : [];
  });
}

test("todo lector de user_sites en CBF está clasificado, y los que admiten o pintan un sitio preguntan por su cuenta", () => {
  const raiz = new URL(".", ROOT).pathname;
  const lectores = ["app", "lib", "src", "middleware.ts"].flatMap((d) => {
    const path = join(raiz, d);
    return statSync(path).isDirectory() ? archivos(path) : [path];
  }).filter((path) => /from\(\s*["']user_sites["']\s*\)/.test(readFileSync(path, "utf8"))).map((path) => relative(raiz, path)).sort();
  assert.deepEqual(lectores, [...LECTORES.keys(), ...SIN_SITIO_QUE_ADMITIR.keys()].sort(), "un lector nuevo de user_sites: clasifícalo");
  for (const path of LECTORES.keys()) {
    assert.match(readFileSync(join(raiz, path), "utf8"), /sitioDeCuentaViva\(/, `${path}: ${LECTORES.get(path)}`);
  }
});
