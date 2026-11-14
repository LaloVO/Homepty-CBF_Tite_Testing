import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

import { findSupabaseKeys, scanCommitRange, scanTrackedFiles } from "./check-no-supabase-keys.mjs";

// 2026-11-13: la service_role heredada de la Suite estaba escrita en `check-remote-migrations.mjs` de este repo PÚBLICO (commit
// 81905bd) y con ella cualquiera ignora toda la RLS. Si una de estas pruebas falla, una llave de Supabase volvió al código, o el
// guardia dejó de verla, o el middleware sigue atado a la llave anon heredada que se apaga al terminar la rotación.
// Las llaves de prueba se arman aquí en cada caso: ninguna llave, real o de mentira, está escrita en este archivo.

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const legacyJwt = (role, iss = "supabase") =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss, ref: "proyectodeprueba", role, iat: 1, exp: 2 })}.${"f".repeat(43)}`;
const newKey = (kind) => `sb_${kind}_${"k".repeat(31)}`;
// Revisión 111 (B1, SF13): el token personal de la cuenta (`sbp_` + 40 hex) abre la API de administración; se arma aquí.
const personalToken = () => ["sbp", "0123456789abcdef".repeat(3).slice(0, 40)].join("_");

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

// ── La guarda (revisión 111, SF13) ──────────────────────────────────────────────────────────────────────────────────────────
// Un repo de git desechable, aislado de la configuración de quien corre la prueba (firmas, hooks, plantillas).
function tempRepo(t) {
  const dir = mkdtempSync(join(tmpdir(), "llaves-supabase-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const env = {
    ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_AUTHOR_NAME: "prueba",
    GIT_AUTHOR_EMAIL: "prueba@example.invalid", GIT_COMMITTER_NAME: "prueba", GIT_COMMITTER_EMAIL: "prueba@example.invalid",
  };
  const git = (...args) => execFileSync("git", args, { cwd: dir, env, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  const write = (file, content) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  };
  const commit = (message) => {
    git("add", "-A");
    git("commit", "-q", "--allow-empty", "-m", message);
    return git("rev-parse", "HEAD");
  };
  return { dir, git, write, commit };
}

test("el guardia ve el token personal sbp_ junto a las demás llaves, y el informe nunca lleva el valor", () => {
  const token = personalToken();
  const found = findSupabaseKeys([`url = "x"`, `Authorization = "Bearer ${token}"`, `SECRET=${newKey("secret")}`].join("\n"));
  assert.deepEqual(found, [
    { line: 2, kind: "sbp_ (token personal de la cuenta)" },
    { line: 3, kind: "sb_secret" },
  ]);
  assert.ok(!JSON.stringify(found).includes(token.slice(4)), "el informe no lleva el token");
  assert.deepEqual(findSupabaseKeys(`sbp_${"g".repeat(40)} sbp_${"a".repeat(39)}`), [], "40 hex exactos; un marcador no es un token");
});

test("un archivo de texto grande se revisa entero (antes se saltaba pasando 5 MB)", (t) => {
  const repo = tempRepo(t);
  const lines = Array.from({ length: 70_000 }, (_, i) => `línea de relleno ${i} ${"x".repeat(80)}`);
  repo.write("datos/grande.txt", `${lines.join("\n")}\nAuthorization: Bearer ${personalToken()}\n`);
  repo.commit("datos");
  assert.ok(readFileSync(join(repo.dir, "datos/grande.txt")).length > 6 * 1024 * 1024);
  assert.deepEqual(scanTrackedFiles(repo.dir), ["datos/grande.txt:70001: sbp_ (token personal de la cuenta)"]);
});

// Revisión sec2 (SF-2, M-G2): una llave escrita en UTF-16 (el `>` de PowerShell 5, «Unicode» del Bloc de notas), en un texto con un
// NUL en sus primeros 4 KB o dentro de un binario es tan pública como en UTF-8. Antes un NUL saltaba el archivo entero, y un UTF-16
// siempre trae NUL: la guarda decía «sin llaves» con la llave en el árbol de este repo público.
const utf16le = (text) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
const utf16beSinBom = (text) => Buffer.from(text, "utf16le").swap16();

test("una llave en UTF-16 (LE con BOM o BE sin BOM), en un texto con NUL o dentro de un binario se ve en el árbol", (t) => {
  const repo = tempRepo(t);
  repo.write("windows/servidor.env", utf16le(`# notas\r\nSUPABASE_SERVICE_ROLE_KEY=sb_secret_${"u".repeat(31)}\r\n`));
  repo.write("windows/token.env", utf16beSinBom(`A=1\nB=${personalToken()}\n`));
  repo.write("datos/con-nul.txt", Buffer.concat([Buffer.from("cabecera\0\nPUBLICA="), Buffer.from(`${newKey("publishable")}\n`)]));
  repo.write("datos/imagen.bin", Buffer.concat([Buffer.from([0x89, 0x50, 0x00, 0x01]), Buffer.from(newKey("secret"))]));
  repo.commit("datos");
  assert.deepEqual(scanTrackedFiles(repo.dir), [
    "datos/con-nul.txt:2: sb_publishable",
    "datos/imagen.bin:1: sb_secret",
    "windows/servidor.env:2: sb_secret",
    "windows/token.env:2: sbp_ (token personal de la cuenta)",
  ]);
});

// Revisión sec2 (SF-2): sin `--text`, git no da el contenido de un archivo que cree binario (cualquiera con un NUL, todo UTF-16), sólo
// «Binary files differ»: una llave así que el push agrega y quita pasaba el rango.
test("el rango ve una llave en UTF-16 o dentro de un binario que el push agrega y quita", (t) => {
  const repo = tempRepo(t);
  repo.write("README.md", "base\n");
  const base = repo.commit("base");
  repo.write("windows/servidor.env", utf16le(`A=1\r\nKEY=sb_secret_${"w".repeat(31)}\r\n`));
  repo.write("datos/imagen.bin", Buffer.concat([Buffer.from([0x89, 0x50, 0x00, 0x01, 0x0a]), Buffer.from(`${personalToken()}\n`)]));
  const adds = repo.commit("agrega");
  repo.git("rm", "-q", "windows/servidor.env", "datos/imagen.bin");
  const head = repo.commit("quita");
  assert.deepEqual(scanTrackedFiles(repo.dir), [], "el árbol final está limpio");
  assert.deepEqual(scanCommitRange(`${base}..${head}`, repo.dir), [
    `${adds.slice(0, 12)} datos/imagen.bin:2: sbp_ (token personal de la cuenta)`,
    `${adds.slice(0, 12)} windows/servidor.env:2: sb_secret`,
  ]);
});

// Revisión sec2 (SF-2): si un archivo versionado no se puede leer, la guarda no sabe si trae una llave: antes lo saltaba y salía con 0.
// Sólo se salta un archivo borrado en el árbol de trabajo (ENOENT): ahí este checkout no tiene nada que publicar.
test("un archivo versionado que no se puede leer detiene la guarda; uno borrado del árbol de trabajo se salta", (t) => {
  const repo = tempRepo(t);
  repo.write("a.txt", "a\n");
  repo.write("borrado.txt", "b\n");
  repo.write("ilegible.txt", "c\n");
  repo.commit("tres");
  rmSync(join(repo.dir, "borrado.txt"));
  assert.deepEqual(scanTrackedFiles(repo.dir), [], "ENOENT: borrado del árbol de trabajo, se salta");
  // Un directorio donde git espera un archivo da EISDIR con cualquier usuario (un chmod 000 no detiene a root).
  rmSync(join(repo.dir, "ilegible.txt"));
  mkdirSync(join(repo.dir, "ilegible.txt"));
  assert.throws(() => scanTrackedFiles(repo.dir), (error) => error?.code === "EISDIR");
  const cli = spawnSync(process.execPath, [new URL("./check-no-supabase-keys.mjs", import.meta.url).pathname], { cwd: repo.dir, encoding: "utf8" });
  assert.equal(cli.status, 2, "la CLI sale con 2, nunca con 0");
});

test("una llave que un push agrega y quita en otro commit no está en el árbol, pero el rango la bloquea", (t) => {
  const repo = tempRepo(t);
  const fromEnv = "const a = 1;\nconst llave = process.env.SUPABASE_SERVICE_ROLE_KEY;\nconst b = 2;\n";
  repo.write("README.md", "base\n");
  repo.write("lib/cliente.ts", fromEnv);
  const base = repo.commit("base");
  repo.write(".codex/config.toml", `[mcp]\nAuthorization = "Bearer ${personalToken()}"\n`);
  repo.write("lib/cliente.ts", `const a = 1;\nconst llave = "${legacyJwt("service_role")}";\nconst b = 2;\n`);
  const adds = repo.commit("agrega llaves (un archivo nuevo y una línea cambiada)");
  repo.git("rm", "-q", ".codex/config.toml");
  repo.write("lib/cliente.ts", fromEnv);
  const head = repo.commit("las quita");
  assert.deepEqual(scanTrackedFiles(repo.dir), [], "el árbol final está limpio");
  const report = scanCommitRange(`${base}..${head}`, repo.dir);
  assert.deepEqual(report, [
    `${adds.slice(0, 12)} .codex/config.toml:2: sbp_ (token personal de la cuenta)`,
    `${adds.slice(0, 12)} lib/cliente.ts:2: service_role heredada (JWT)`,
  ]);
  assert.ok(!report.join("\n").includes(personalToken().slice(4)), "el informe no lleva el token");
  assert.deepEqual(scanCommitRange(`${adds}..${head}`, repo.dir), [], "sólo mira lo que agrega el rango, no lo que quita");
});

test("una fusión que mete una llave al resolverla se ve contra su primer padre", (t) => {
  const repo = tempRepo(t);
  repo.write("a.txt", "a\n");
  const base = repo.commit("base");
  repo.git("checkout", "-q", "-b", "rama");
  repo.write("b.txt", "b\n");
  repo.commit("rama");
  repo.git("checkout", "-q", "main");
  repo.write("c.txt", "c\n");
  repo.commit("main");
  repo.git("merge", "-q", "--no-ff", "--no-commit", "rama");
  repo.write("c.txt", `c\nPUBLICA=${newKey("publishable")}\n`);
  const merge = repo.commit("fusión con llave");
  assert.deepEqual(scanCommitRange(`${base}..${merge}`, repo.dir), [`${merge.slice(0, 12)} c.txt:2: sb_publishable`]);
});

test("un rango mal escrito o sin historial falla con el motivo, nunca pasa en silencio", (t) => {
  const repo = tempRepo(t);
  repo.write("a.txt", "a\n");
  const head = repo.commit("a");
  assert.throws(() => scanCommitRange(head, repo.dir), /Rango inválido/);
  assert.throws(() => scanCommitRange(`--output=/tmp/x..${head}`, repo.dir), /Rango inválido/);
  assert.throws(() => scanCommitRange(`${"0".repeat(40)}..${head}`, repo.dir), /No encuentro el commit .*fetch-depth: 0/);
  const cli = spawnSync(process.execPath, [new URL("./check-no-supabase-keys.mjs", import.meta.url).pathname, "--rango", `nada..${head}`],
    { cwd: repo.dir, encoding: "utf8" });
  assert.equal(cli.status, 2);
  assert.match(cli.stderr, /No encuentro el commit «nada»/);
});

// ── Revisión sec2b (SF-R5): lo que un commit publica fuera del contenido de un archivo ─────────────────────────────────────────
// El mensaje de cada commit, el nombre y la ruta de cada archivo y el destino de cada enlace simbólico (lo que git guarda de él) se
// publican igual que una línea, y en este repo público cualquiera los lee. Pegar un log con una llave en el mensaje es un error
// realista. Antes, el rango sólo leía los diffs y el árbol sólo el contenido.
const guardCli = new URL("./check-no-supabase-keys.mjs", import.meta.url).pathname;

test("SF-R5: una llave en el mensaje de un commit, también en el de una fusión, detiene el rango, y el informe no la repite", (t) => {
  const repo = tempRepo(t);
  repo.write("a.txt", "a\n");
  const base = repo.commit("base");
  const secret = `sb_secret_${"m".repeat(31)}`;
  const inSubject = repo.commit(`config: SUPABASE_SERVICE_ROLE_KEY=${secret}`);
  repo.write("b.txt", "b\n");
  const inBody = repo.commit(`ci: el log del deploy\n\nsalida:\nAuthorization: Bearer ${personalToken()}`);
  repo.git("checkout", "-q", "-b", "rama");
  repo.write("c.txt", "c\n");
  repo.commit("docs: la llave va en NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx, nunca en el código");
  repo.git("checkout", "-q", "main");
  repo.git("merge", "-q", "--no-ff", "-m", `fusión: ${legacyJwt("service_role")}`, "rama");
  const merge = repo.git("rev-parse", "HEAD");
  assert.deepEqual(scanTrackedFiles(repo.dir), [], "el árbol está limpio: la llave sólo está en los mensajes");
  const report = scanCommitRange(`${base}..${merge}`, repo.dir);
  assert.deepEqual([...report].sort(), [
    `${inSubject.slice(0, 12)} (mensaje del commit):1: sb_secret`,
    `${inBody.slice(0, 12)} (mensaje del commit):4: sbp_ (token personal de la cuenta)`,
    `${merge.slice(0, 12)} (mensaje del commit):1: service_role heredada (JWT)`,
  ].sort(), "el asunto, el cuerpo y la fusión; el marcador sb_publishable_xxx no es una llave");
  assert.deepEqual(scanCommitRange(`${inBody}..${merge}`, repo.dir), [`${merge.slice(0, 12)} (mensaje del commit):1: service_role heredada (JWT)`],
    "sólo los commits del rango");
  const cli = spawnSync(process.execPath, [guardCli, "--rango", `${base}..${merge}`], { cwd: repo.dir, encoding: "utf8" });
  assert.equal(cli.status, 1);
  for (const value of [secret, personalToken(), legacyJwt("service_role")]) {
    assert.ok(!`${cli.stdout}${cli.stderr}${report.join("\n")}`.includes(value.slice(4)), "el informe nunca lleva la llave");
  }
});

test("SF-R5: una llave en el nombre o la ruta de un archivo, también vacío, se ve en el árbol y en el rango, tapada en el informe", (t) => {
  const repo = tempRepo(t);
  repo.write("README.md", "base\n");
  const base = repo.commit("base");
  const secret = `sb_secret_${"n".repeat(31)}`;
  const publishable = `sb_publishable_${"v".repeat(31)}`;
  repo.write(`cfg/${secret}.txt`, "nada\n");
  repo.write(`tokens/${personalToken()}/notas.md`, `PUBLICA=${publishable}\n`);
  repo.write(`vacio-${publishable}`, ""); // un archivo vacío no trae «+++» ni líneas en el diff
  const adds = repo.commit("agrega");
  const tree = scanTrackedFiles(repo.dir);
  assert.deepEqual(tree, [
    "cfg/«llave».txt: sb_secret en el nombre",
    "tokens/«llave»/notas.md: sbp_ (token personal de la cuenta) en el nombre",
    "tokens/«llave»/notas.md:1: sb_publishable",
    "vacio-«llave»: sb_publishable en el nombre",
  ]);
  repo.git("rm", "-q", "-r", "--", "cfg", "tokens", `vacio-${publishable}`);
  const head = repo.commit("quita");
  assert.deepEqual(scanTrackedFiles(repo.dir), [], "el árbol final está limpio");
  const range = scanCommitRange(`${base}..${head}`, repo.dir);
  assert.deepEqual([...range].sort(), [
    `${adds.slice(0, 12)} cfg/«llave».txt: sb_secret en el nombre`,
    `${adds.slice(0, 12)} tokens/«llave»/notas.md: sbp_ (token personal de la cuenta) en el nombre`,
    `${adds.slice(0, 12)} tokens/«llave»/notas.md:1: sb_publishable`,
    `${adds.slice(0, 12)} vacio-«llave»: sb_publishable en el nombre`,
  ].sort());
  assert.deepEqual(scanCommitRange(`${adds}..${head}`, repo.dir), [], "borrar un archivo no agrega su nombre");
  const cli = spawnSync(process.execPath, [guardCli, "--rango", `${base}..${head}`], { cwd: repo.dir, encoding: "utf8" });
  assert.equal(cli.status, 1);
  for (const value of [secret, publishable, personalToken()]) {
    assert.ok(!`${cli.stdout}${cli.stderr}${tree.join("\n")}${range.join("\n")}`.includes(value.slice(4)), "el informe nunca lleva la llave");
  }
});

test("SF-R5: un enlace simbólico se revisa por su destino sin seguirlo: colgante, hacia fuera del repo o en un directorio de la ruta", (t) => {
  const repo = tempRepo(t);
  const outside = mkdtempSync(join(tmpdir(), "llaves-fuera-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, "servidor.env"), `SUPABASE_SERVICE_ROLE_KEY=sb_secret_${"f".repeat(31)}\n`);
  symlinkSync(`sb_secret_${"c".repeat(31)}`, join(repo.dir, "colgante")); // su destino es la llave
  symlinkSync(join(outside, "servidor.env"), join(repo.dir, "hacia-fuera")); // lo de fuera no es del repo: no se lee
  repo.write("datos/real.env", `PUBLICA=sb_publishable_${"r".repeat(31)}\n`);
  symlinkSync("datos/real.env", join(repo.dir, "datos-enlace")); // apunta dentro: el archivo cuenta una vez, por sí mismo
  repo.commit("enlaces");
  assert.deepEqual(scanTrackedFiles(repo.dir), [
    "colgante: sb_secret en el destino del enlace simbólico",
    "datos/real.env:1: sb_publishable",
  ]);
  // Un directorio de la ruta de un archivo versionado que pasó a ser un enlace: seguirlo leería algo que git no versiona.
  repo.write("conf/servidor.env", "SIN_LLAVE=1\n");
  repo.commit("conf");
  rmSync(join(repo.dir, "conf"), { recursive: true });
  symlinkSync(outside, join(repo.dir, "conf"));
  assert.throws(() => scanTrackedFiles(repo.dir), /conf\/servidor\.env: su ruta pasa por el enlace simbólico conf y la guarda no lo sigue/);
  const cli = spawnSync(process.execPath, [guardCli], { cwd: repo.dir, encoding: "utf8" });
  assert.equal(cli.status, 2, "la CLI sale con 2, nunca con 0");
});

test("SF-R5: un error de lectura no repite la llave que trae el nombre del archivo", (t) => {
  const repo = tempRepo(t);
  const secret = `sb_secret_${"e".repeat(31)}`;
  repo.write(`d-${secret}/f.txt`, "a\n");
  repo.commit("d");
  rmSync(join(repo.dir, `d-${secret}`), { recursive: true });
  writeFileSync(join(repo.dir, `d-${secret}`), "ahora es un archivo\n"); // ENOTDIR: el mensaje del error trae la ruta
  const cli = spawnSync(process.execPath, [guardCli], { cwd: repo.dir, encoding: "utf8" });
  assert.equal(cli.status, 2);
  assert.match(cli.stderr, /ENOTDIR/);
  assert.ok(!`${cli.stdout}${cli.stderr}`.includes(secret.slice(4)), "el error sale con la llave tapada");
});

test("el workflow del guardia revisa el árbol y cada commit del push o del pull request, con el historial completo", () => {
  const workflow = readFileSync(new URL("../.github/workflows/llaves-supabase.yml", import.meta.url), "utf8");
  assert.match(workflow, /^on:\n  push:\n  pull_request:\n/m);
  assert.match(workflow, /actions\/checkout@v4\n\s+with:\n(?:\s+#.*\n)*\s+fetch-depth: 0\n/);
  assert.match(workflow, /^\s+node scripts\/check-no-supabase-keys\.mjs$/m);
  assert.match(workflow, /pull_request\)\n\s+node scripts\/check-no-supabase-keys\.mjs --rango "\$PR_BASE\.\.\$GITHUB_SHA"/);
  assert.match(workflow, /push\)[\s\S]*git merge-base "origin\/\$DEFAULT_BRANCH" "\$GITHUB_SHA"[\s\S]*--rango "\$BEFORE\.\.\$GITHUB_SHA"/);
});

// Revisión sec2 (SF-3): las pruebas de este archivo sólo corrían a mano, así que un guardia que dejara de ver una llave (o un workflow
// que dejara de revisar el rango) pasaba CI en verde. Ahora corren en el mismo workflow, sólo con permiso de lectura y sin secretos.
// Necesitan `typescript`: van después de instalar, y el guardia antes, para que no dependa de código de terceros.
test("CI corre estas pruebas después de instalar, el guardia antes, y el workflow sólo lee el repo", () => {
  const workflow = readFileSync(new URL("../.github/workflows/llaves-supabase.yml", import.meta.url), "utf8");
  const yaml = workflow.split("\n").filter((line) => !/^\s*#/.test(line)).join("\n"); // sin comentarios
  assert.match(yaml, /^permissions:\n  contents: read\n/m);
  assert.doesNotMatch(yaml, /id-token|secrets\./);
  const guard = yaml.indexOf("node scripts/check-no-supabase-keys.mjs\n");
  const install = yaml.indexOf("- run: pnpm install --frozen-lockfile");
  const tests = yaml.indexOf("run: node --test scripts/test-supabase-keys.mjs");
  assert.ok(guard !== -1 && install !== -1 && tests !== -1, "el guardia, la instalación y las pruebas están en el workflow");
  assert.ok(guard < install && install < tests, "guardia, después instalación, después pruebas");
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
