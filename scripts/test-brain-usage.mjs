import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

// Revisión sec2, SF-13: CBF escribía en claro, en `brain_api_usage` de la base del Brain, la llave de cada llamada de valuación (16 copias
// de dos llaves vivas en septiembre). Si una prueba falla, una llave de sitio vuelve a salir de la Suite hacia otra base. Corren la ruta
// real (/api/cbf/intelligence/valuation) y lib/intelligence.ts reales; el Brain, la autenticación y Postgres son de mentira.

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
const ROOT = new URL("../", import.meta.url);
const huella = (llave) => createHash("sha256").update(llave).digest("hex");
const LLAVE = "cbf_live_fixture_valuacion_0123456789abcd";

function loadModule(relativePath, dependencies, env = {}) {
  const file = new URL(relativePath, ROOT);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file.pathname,
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, URL, Response, Date,
    require: (name) => dependencies[name] ?? require(name),
    process: { env },
    console: { error() {}, warn() {}, log() {} },
  }, { filename: file.pathname });
  return module.exports;
}

/** La ruta de valuación con el Brain respondiendo como `brain` dice; devuelve lo que se anotó en brain_api_usage. */
async function valuar(brain) {
  const anotadas = [];
  const keys = loadModule("lib/site-keys.ts", { "next/server": { after() {} }, "./supabase": { supabase: null } });
  const ruta = loadModule("app/api/cbf/intelligence/valuation/route.ts", {
    "next/server": { NextRequest, NextResponse },
    "@/lib/auth": { authMiddleware: async () => ({ siteId: "sitio-1", userId: "dueno-1", organizationId: null, accessBasis: "lifecycle" }) },
    "@/lib/brain-client": {
      brainValueEstimate: async () => { if (brain === "lanza") throw new Error("caído"); return brain; },
      brainInterpretValuation: async () => "explicación",
      valuationResultForLLM: (v) => v,
    },
    "@/lib/intelligence": { trackBrainUsage: async (entrada) => { anotadas.push(entrada); } },
    "@/lib/site-keys": keys,
  });
  const res = await ruta.POST(new NextRequest("https://cbf.example.test/api/cbf/intelligence/valuation", {
    method: "POST", headers: { Authorization: `Bearer ${LLAVE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ lat: 25.67, lon: -100.31, direccion: "Calle 1" }),
  }));
  return { status: res.status, anotadas };
}

test("la valuación anota el consumo con la huella sha256 de la llave, nunca con la llave, en sus cinco caminos", async () => {
  const caminos = [
    ["el Brain no responde (excepción)", "lanza", 502, 1],
    ["el Brain no responde (null)", null, 502, 1],
    ["sin comparables", { valuation_status: { status: "insufficient_comparables" } }, 200, 1],
    ["estimada (valuación y explicación)", { valuation_status: { status: "estimated" }, valor_promedio: 1000000, valor_promedio_m2: 20000,
      inmuebles: [{}, {}, {}], search_params: {} }, 200, 2],
  ];
  let total = 0;
  for (const [nombre, brain, status, filas] of caminos) {
    const { status: s, anotadas } = await valuar(brain);
    assert.equal(s, status, nombre);
    assert.equal(anotadas.length, filas, `${nombre}: ${filas} anotación(es)`);
    for (const a of anotadas) assert.equal(a.cbf_api_key, huella(LLAVE), `${nombre}: la huella, no la llave`);
    assert.equal(JSON.stringify(anotadas).includes("cbf_live_"), false, `${nombre}: ninguna llave en lo que se anota`);
    total += anotadas.length;
  }
  assert.equal(total, 5, "las cinco llamadas de la ruta");
});

test("trackBrainUsage guarda la huella aunque le llegue una llave en claro; una huella o un nulo pasan como están", async () => {
  const consultas = [];
  class Pool { async query(sql, params) { consultas.push({ sql, params }); return { rows: [] }; } async end() {} }
  const intel = loadModule("lib/intelligence.ts", { pg: { Pool } }, { BRAIN_DATABASE_URL: "postgres://fixture.invalid/brain" });
  await intel.trackBrainUsage({ user_id_supabase: "u", cbf_api_key: LLAVE, brain_endpoint: "valueweb.estimate" });
  await intel.trackBrainUsage({ user_id_supabase: "u", cbf_api_key: huella(LLAVE), brain_endpoint: "valueweb.estimate" });
  await intel.trackBrainUsage({ user_id_supabase: "u", cbf_api_key: null, brain_endpoint: "valueweb.estimate" });
  assert.deepEqual(consultas.map((c) => c.params[1]), [huella(LLAVE), huella(LLAVE), null]);
  assert.equal(JSON.stringify(consultas).includes("cbf_live_"), false);
});
