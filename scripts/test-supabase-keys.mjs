import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

import { findSupabaseKeys, scanTrackedFiles } from "./check-no-supabase-keys.mjs";

// 2026-11-13: la service_role heredada de la Suite estaba escrita en `check-remote-migrations.mjs` de este repo PÚBLICO (commit
// 81905bd) y con ella cualquiera ignora toda la RLS. Si una de estas pruebas falla, una llave de Supabase volvió al código, o el
// guardia dejó de verla, o el middleware sigue atado a la llave anon heredada que se apaga al terminar la rotación.
// Las llaves de prueba se arman aquí en cada caso: ninguna llave, real o de mentira, está escrita en este archivo.

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const legacyJwt = (role, iss = "supabase") =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss, ref: "proyectodeprueba", role, iat: 1, exp: 2 })}.${"f".repeat(43)}`;
const newKey = (kind) => `sb_${kind}_${"k".repeat(31)}`;

test("el guardia ve la service_role y la anon heredadas y las llaves nuevas, y nunca repite el valor", () => {
  const service = legacyJwt("service_role");
  const text = [
    `const supabaseKey = "${service}";`,
    "// nada aquí",
    `fetch(url, { headers: { apikey: "${legacyJwt("anon")}" } })`,
    `SECRET=${newKey("secret")} PUBLIC=${newKey("publishable")}`,
  ].join("\n");
  const found = findSupabaseKeys(text);
  assert.deepEqual(found, [
    { line: 1, kind: "service_role heredada (JWT)" },
    { line: 3, kind: "anon heredada (JWT)" },
    { line: 4, kind: "sb_secret" },
    { line: 4, kind: "sb_publishable" },
  ]);
  assert.ok(!JSON.stringify(found).includes(service.split(".")[1]), "el informe no lleva la llave");
});

test("una JWT que no es de Supabase y los marcadores de ejemplo no son llaves", () => {
  assert.deepEqual(findSupabaseKeys(`token=${legacyJwt("authenticated", "https://auth.example.test")}`), []);
  assert.deepEqual(findSupabaseKeys("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx\nSUPABASE_SERVICE_ROLE_KEY="), []);
});

test("ningún archivo versionado de CBF trae una llave de Supabase (check-remote-migrations.mjs incluido)", () => {
  assert.deepEqual(scanTrackedFiles(), []);
});

function loadServerClient(env) {
  const calls = [];
  const fake = { createClient: (url, key) => (calls.push({ url, key }), { fake: true }) };
  const file = new URL("../lib/supabase/server.ts", import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file.pathname,
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, process: { env },
    require: (name) => (name === "@supabase/supabase-js" ? fake : assert.fail(`dependencia inesperada ${name}`)),
  });
  return { createClient: module.exports.createClient, calls };
}

test("el cliente del middleware usa la llave publicable cuando está, aunque siga la anon heredada", async () => {
  const anon = legacyJwt("anon");
  const publishable = newKey("publishable");
  const { createClient, calls } = loadServerClient({
    NEXT_PUBLIC_SUPABASE_URL: "https://suite.invalid", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  });
  await createClient();
  assert.deepEqual(calls, [{ url: "https://suite.invalid", key: publishable }]);
});

test("sin publicable, la anon heredada sigue funcionando mientras Supabase la acepte; sin ninguna, falla fuerte", async () => {
  const anon = legacyJwt("anon");
  const conAnon = loadServerClient({ NEXT_PUBLIC_SUPABASE_URL: "https://suite.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: anon });
  await conAnon.createClient();
  assert.equal(conAnon.calls[0].key, anon);
  const sinLlave = loadServerClient({ NEXT_PUBLIC_SUPABASE_URL: "https://suite.invalid" });
  await assert.rejects(sinLlave.createClient(), /Missing Supabase environment variables/);
  assert.equal(sinLlave.calls.length, 0);
});
