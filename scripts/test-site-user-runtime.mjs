import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");

// Execute the real handler, authentication and supabase-js query builder. Only transport is a
// fixture: no .env, credentials, real database, browser or server is involved.
function loadModule(relativePath, dependencies) {
  const file = new URL(`../${relativePath}`, import.meta.url);
  const source = readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require: (name) => dependencies[name] ?? require(name),
    process: { env: { MAPBOX_ACCESS_TOKEN: "fixture-map-token" } },
    console: { error() {} },
  }, { filename: file.pathname });
  return module.exports;
}

const profile = {
  id: "fixture-owner", nombre_usuario: "Asesora de prueba", email_usuario: "perfil@example.test",
  telefono_usuario: "5500000000", imagen_perfil_usuario: "https://example.test/foto.jpg",
  actividad_usuario: "Asesor", banner_usuario: "https://example.test/banner.jpg",
  descripcion_usuario: "Perfil profesional de prueba", actividades: ["Asesor"],
  actividad_claves: ["asesor"], servicios: ["Comercialización"], como_trabaja: "Con cita",
  id_estado: 5, id_ciudad: 50, estados: { nombre_estado: "Coahuila" }, ciudades: { nombre_ciudad: "Saltillo" },
  mostrar_email_perfil: false, mostrar_telefono_perfil: false,
  subject_ref: "INTERNAL", managed_by_org_id: "INTERNAL", estado_usuario: true,
};

function harness(options = {}) {
  const requests = [];
  const client = createClient("https://fixture.invalid", "fixture-service-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url) => {
      const query = new URL(url);
      requests.push(query);
      const table = query.pathname.split("/").at(-1);
      const select = query.searchParams.get("select");
      let data;
      if (query.pathname.endsWith("/rpc/usuario_eliminado")) {
        // HPY-216: el sitio pregunta si la cuenta de su dueño está eliminada (lib/site-owner.ts); esta no lo está.
        data = false;
      } else if (table === "usuarios") {
        if (options.userError) return new Response(JSON.stringify({ message: "fixture only", code: "PGRST116" }), { status: 406 });
        assert.equal(query.searchParams.get("id"), "eq.fixture-owner", "a site can only retrieve its authenticated owner");
        assert.equal(select.includes("*"), false, "a public site key must never retrieve an internal row");
        const row = { ...profile, ...options.profile };
        data = Object.fromEntries(select.split(/,(?![^()]*\))/).map((column) => {
          const relation = column.match(/^(estados|ciudades)\((\w+)\)$/);
          return relation ? [relation[1], row[relation[1]]] : [column, row[column]];
        }));
      } else if (table === "user_sites" && select.includes("lifecycle_status")) {
        assert.equal(query.searchParams.get("cbf_api_key"), "eq.cbf_live_fixture");
        data = { id: "fixture-site", user_id_supabase: "fixture-owner", organization_id: null,
          is_active: !options.suspended, lifecycle_status: options.suspended ? "suspended" : "active" };
      } else {
        assert.equal(table, "user_sites");
        assert.equal(select, "site_name,theme_config");
        assert.equal(query.searchParams.get("id"), "eq.fixture-site", "configuration belongs to this site, not another site of the owner");
        data = { site_name: "Sitio de prueba", theme_config: { logo: null } };
      }
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    } },
  });
  const access = loadModule("lib/site-runtime-access.ts", {});
  const owner = loadModule("lib/site-owner.ts", { "./supabase": { supabase: client } });
  const auth = loadModule("lib/auth.ts", { "next/server": { NextResponse }, "./supabase": { supabase: client }, "./site-runtime-access": access,
    "./site-owner": owner });
  const { GET } = loadModule("app/api/cbf/user/route.ts", {
    "next/server": { NextRequest, NextResponse }, "@/lib/auth": auth, "@/lib/supabase": { supabase: client },
  });
  return { requests, get: (authorization = "Bearer cbf_live_fixture") => GET(new NextRequest("https://site.example.test/api/cbf/user", {
    headers: authorization === null ? {} : { Authorization: authorization },
  })) };
}

test("runtime /user: an active site gets the complete professional profile even when legacy toggles are false", async () => {
  const api = harness();
  const response = await api.get();
  assert.equal(response.status, 200);
  const { data } = await response.json();
  const { estados, ciudades, mostrar_email_perfil, mostrar_telefono_perfil, subject_ref, managed_by_org_id, estado_usuario, ...expected } = profile;
  assert.deepEqual(data.user, { ...expected, estado: estados.nombre_estado, ciudad: ciudades.nombre_ciudad });
  assert.deepEqual(data.site, { site_name: "Sitio de prueba", theme_config: { logo: null }, platform_config: { mapbox_token: "fixture-map-token" } });
  assert.equal(api.requests.length, 4);
});

test("runtime /user: missing location/contact remains null; no invented location or mandatory contact", async () => {
  const api = harness({ profile: { estados: null, ciudades: null, id_estado: null, id_ciudad: null, telefono_usuario: null, email_usuario: null } });
  const response = await api.get();
  assert.equal(response.status, 200);
  const { data } = await response.json();
  for (const field of ["estado", "ciudad", "id_estado", "id_ciudad", "telefono_usuario", "email_usuario"]) assert.equal(data.user[field], null, field);
});

test("runtime /user: profile read errors do not fabricate an empty successful profile", async () => {
  const api = harness({ userError: true });
  const response = await api.get();
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Error al obtener información del usuario" });
  assert.equal(api.requests.length, 3);
});

test("runtime /user: missing/malformed/placeholder keys never reach profile data", async () => {
  for (const authorization of [null, "Basic fixture", "Bearer cbf_live_PENDING_TEST"]) {
    const api = harness();
    assert.equal((await api.get(authorization)).status, 401);
    assert.equal(api.requests.length, 0);
  }
});

test("runtime /user: publication of professional contacts preserves suspension gates", async () => {
  const api = harness({ suspended: true });
  assert.equal((await api.get()).status, 401);
  // HPY-216: la cuenta del sitio se pregunta para toda llave que nombra un sitio, también uno suspendido (lib/auth.ts).
  assert.equal(api.requests.length, 2);
  assert.equal(api.requests.some((request) => request.pathname.endsWith("/usuarios")), false);
});
