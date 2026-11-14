#!/usr/bin/env node
/**
 * Falla si un archivo versionado trae una llave de Supabase: una JWT heredada de un proyecto (anon o service_role, `iss`
 * = "supabase") o una llave nueva (`sb_secret_…`, `sb_publishable_…`). Nunca imprime la llave: sólo archivo, línea y tipo.
 *
 * Por qué (2026-11-13): `check-remote-migrations.mjs` (commit 81905bd, 2026-05-30) traía escrita la service_role heredada de la
 * Suite en el repo PÚBLICO de CBF: con ella cualquiera ignora toda la RLS. Las llaves se leen sólo del entorno (ECS, Vercel,
 * Railway, .env.local sin versionar); ninguna llave, ni la pública, va en el código.
 *
 * Revisión 111 (2026-11-13): también ve el token personal de Supabase (`sbp_…`). Ese token abre la API de administración de la
 * cuenta (con él se vuelven a habilitar las llaves heredadas o se leen las nuevas) y estuvo versionado en `.codex/config.toml` de
 * Welcome. Revisa los archivos de cualquier tamaño y, con `--rango`, cada línea que agrega cada commit del rango: una llave que un
 * push agrega y luego quita ya no está en el árbol, pero sí en el historial que se publicó.
 *
 * Revisión sec2 (2026-11-14, SF-2): ningún archivo se salta. Antes, un NUL en los primeros 4 KB saltaba el archivo entero, y un
 * UTF-16 siempre trae NUL. Ahora cada archivo se lee byte a byte (latin1) y cada línea se busca sin sus NUL: las llaves son ASCII,
 * así que se ven en UTF-8, en UTF-16 (LE o BE, con o sin BOM), en un texto con NUL y dentro de un binario. El rango pide `--text`
 * por lo mismo (sin él git sólo dice «Binary files differ»). Un archivo que no se puede leer detiene la guarda; sólo uno borrado en
 * el árbol de trabajo (ENOENT) se salta. Es el mismo archivo en la Suite, Welcome y CBF: se copia igual (sha256) a los tres.
 *
 * Uso: node scripts/check-no-supabase-keys.mjs                         (revisa `git ls-files` del directorio actual)
 *      node scripts/check-no-supabase-keys.mjs --rango base..cabeza    (revisa las líneas que agrega cada commit de base..cabeza)
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const NEW_KEY = /sb_(secret|publishable)_[A-Za-z0-9_-]{20,}/g;
const PERSONAL_TOKEN = /sbp_[0-9a-f]{40}/g;
const GIT_BUFFER = 1024 * 1024 * 1024;
// La salida de git no depende de la configuración de quien la corre (prefijos, color, firmas, conversores, renombres).
const GIT_LOG = ["-c", "core.quotePath=false", "log", "--patch", "--text", "--unified=0", "--inter-hunk-context=0",
  "--diff-merges=first-parent", "--no-renames", "--no-color", "--no-ext-diff", "--no-textconv", "--no-show-signature", "--src-prefix=a/",
  "--dst-prefix=b/", "--format=commit %H"];

/** El tipo de una JWT si es una llave de Supabase («service_role heredada», «anon heredada»…); `null` si no lo es. */
function supabaseJwtKind(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    if (payload && payload.iss === "supabase") return `${payload.role ?? "sin rol"} heredada (JWT)`;
  } catch {
    return null;
  }
  return null;
}

/**
 * Las llaves de Supabase de una línea, como tipos. Nunca devuelve el valor. Los NUL se quitan antes de buscar: así una llave en
 * UTF-16 (cada carácter ASCII seguido o precedido de un NUL) o partida por un NUL se ve igual que en UTF-8.
 */
function keyKindsInLine(line) {
  const content = line.includes("\0") ? line.replaceAll("\0", "") : line;
  const kinds = [];
  for (const match of content.matchAll(JWT)) {
    const kind = supabaseJwtKind(match[0]);
    if (kind) kinds.push(kind);
  }
  for (const match of content.matchAll(NEW_KEY)) kinds.push(`sb_${match[1]}`);
  for (const _ of content.matchAll(PERSONAL_TOKEN)) kinds.push("sbp_ (token personal de la cuenta)");
  return kinds;
}

/** Las llaves de Supabase de un texto, como `{ line, kind }`. Nunca devuelve el valor. */
export function findSupabaseKeys(text) {
  const found = [];
  text.split(/\r?\n/).forEach((content, index) => {
    for (const kind of keyKindsInLine(content)) found.push({ line: index + 1, kind });
  });
  return found;
}

/**
 * Los hallazgos de los archivos versionados de `cwd`, como líneas `archivo:línea: tipo`. Ningún archivo se salta por su tamaño ni
 * por su codificación; uno que no se puede leer lanza (sólo se salta uno borrado en el árbol de trabajo).
 */
export function scanTrackedFiles(cwd = process.cwd()) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd, encoding: "utf8", maxBuffer: GIT_BUFFER }).split("\0").filter(Boolean);
  const report = [];
  for (const file of files) {
    let buffer;
    try {
      buffer = readFileSync(`${cwd}/${file}`);
    } catch (error) {
      if (error?.code === "ENOENT") continue; // borrado en el árbol de trabajo
      throw error;
    }
    // latin1: un byte, un carácter. Nada se reemplaza, así que una llave ASCII se ve aunque el archivo no sea UTF-8.
    for (const { line, kind } of findSupabaseKeys(buffer.toString("latin1"))) report.push(`${file}:${line}: ${kind}`);
  }
  return report;
}

/** `base..cabeza` → `[base, cabeza]`, ya resueltos a commits; lanza con el motivo si el rango no sirve. */
function resolveRange(range, cwd) {
  const at = typeof range === "string" ? range.indexOf("..") : -1;
  const ends = at > 0 ? [range.slice(0, at), range.slice(at + 2)] : [];
  if (ends.length !== 2 || ends.some((end) => !end || /^[-.]|\s/.test(end))) {
    throw new Error(`Rango inválido «${range}»: usa base..cabeza (dos commits)`);
  }
  return ends.map((end) => {
    try {
      return execFileSync("git", ["rev-parse", "--verify", "--quiet", `${end}^{commit}`], { cwd, encoding: "utf8" }).trim();
    } catch {
      throw new Error(`No encuentro el commit «${end}» (¿falta historial? el checkout necesita fetch-depth: 0)`);
    }
  });
}

/** Las líneas de un Buffer, sin el salto final, decodificadas una por una (la salida de git puede pasar del tope de un string). */
function* bufferLines(buffer) {
  for (let start = 0; start < buffer.length; ) {
    const newline = buffer.indexOf(10, start);
    const end = newline === -1 ? buffer.length : newline;
    yield buffer.toString("utf8", start, end).replace(/\r$/, "");
    start = end + 1;
  }
}

/**
 * Los hallazgos de las líneas que agrega cada commit de `base..cabeza` (una fusión, contra su primer padre), como
 * `commit archivo:línea: tipo`. La línea es la del archivo en ese commit.
 */
export function scanCommitRange(range, cwd = process.cwd()) {
  const [base, head] = resolveRange(range, cwd);
  const log = execFileSync("git", [...GIT_LOG, `${base}..${head}`, "--"], { cwd, maxBuffer: GIT_BUFFER });
  const report = [];
  let commit = "";
  let file = null;
  let line = 0;
  let oldLeft = 0;
  let newLeft = 0;
  for (const text of bufferLines(log)) {
    if (oldLeft > 0 || newLeft > 0) {
      // Cuerpo de un bloque: se cuentan sus líneas con la cabecera @@, así una línea que empieza con «+++» o «commit» no confunde.
      if (text.startsWith("+") && newLeft > 0) {
        for (const kind of keyKindsInLine(text.slice(1))) report.push(`${commit.slice(0, 12)} ${file}:${line}: ${kind}`);
        line += 1;
        newLeft -= 1;
        continue;
      }
      if (text.startsWith("-") && oldLeft > 0) {
        oldLeft -= 1;
        continue;
      }
      if (text.startsWith(" ")) {
        line += 1;
        oldLeft -= 1;
        newLeft -= 1;
        continue;
      }
      if (text.startsWith("\\")) continue; // «\ No newline at end of file»
      oldLeft = 0;
      newLeft = 0;
    }
    if (text.startsWith("commit ")) {
      commit = text.slice(7).trim();
      file = null;
    } else if (text.startsWith("diff --git ")) {
      file = null;
    } else if (text.startsWith("+++ ")) {
      const path = text.slice(4);
      file = path === "/dev/null" ? null : path.replace(/^"?b\//, "").replace(/"$/, "");
    } else {
      const hunk = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(text);
      if (hunk) {
        oldLeft = hunk[1] === undefined ? 1 : Number(hunk[1]);
        line = Number(hunk[2]);
        newLeft = hunk[3] === undefined ? 1 : Number(hunk[3]);
      }
    }
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  try {
    let report;
    let where;
    if (args.length === 0) {
      report = scanTrackedFiles();
      where = "los archivos versionados";
    } else if (args.length === 2 && args[0] === "--rango") {
      report = scanCommitRange(args[1]);
      where = `las líneas que agrega ${args[1]}`;
    } else {
      console.error("Uso: node scripts/check-no-supabase-keys.mjs [--rango base..cabeza]");
      process.exit(2);
    }
    if (report.length > 0) {
      console.error(`Llaves de Supabase en ${where} (sácalas del código, ponlas en el entorno y rota la que se haya publicado; ` +
        "si ya se empujó, quitarla en un commit posterior no la saca del historial):");
      for (const line of report) console.error(`  ${line}`);
      process.exit(1);
    }
    console.log(`Sin llaves de Supabase en ${where}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
