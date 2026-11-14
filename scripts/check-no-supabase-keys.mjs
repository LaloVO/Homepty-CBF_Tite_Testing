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
 * el árbol de trabajo (ENOENT) se salta.
 *
 * Revisión sec2b (2026-11-14, SF-R5): un commit también publica su mensaje, el nombre de cada archivo y el destino de cada enlace
 * simbólico. Pegar un log con una llave en el mensaje es un error realista, y en la Suite y Welcome (privados, sin secret scanning
 * visible) esta guarda es el único control automático. Ahora el rango revisa además el mensaje de cada commit (también el de una
 * fusión) y el nombre y la ruta de cada archivo que queda en el commit (también uno vacío, que no trae líneas); el árbol revisa el
 * nombre y la ruta de cada archivo y el destino de cada enlace, que es lo que git guarda de él. Un enlace se lee con readlink y nunca
 * se sigue: uno colgante ya no se salta, y uno que apunta fuera del repo no hace leer nada de fuera. Si un directorio de la ruta de
 * un archivo versionado es un enlace, la guarda se detiene en vez de seguirlo. Una ruta con una llave sale con la llave tapada
 * («llave»), también en los mensajes de error.
 *
 * Lo que no ve (revisión sec2b, N8; una expresión regular no lo arregla): una llave partida en dos líneas, con `\` de shell o
 * concatenada en JS; una dentro de un gzip, en base64, con escapes `\u` de JSON o con un carácter de ancho cero; el mensaje de una
 * etiqueta anotada. Falla cerrada (sale con 2, falso rojo) con un force-push, porque el commit de antes ya no está en ningún ref, y
 * con un submódulo en el árbol (EISDIR).
 *
 * Es el mismo archivo en la Suite, Welcome y CBF: se copia igual (sha256) a los tres.
 *
 * Uso: node scripts/check-no-supabase-keys.mjs                         (revisa `git ls-files` del directorio actual: contenido,
 *                                                                        nombre y ruta de cada archivo, destino de cada enlace)
 *      node scripts/check-no-supabase-keys.mjs --rango base..cabeza    (revisa lo que agrega cada commit de base..cabeza: líneas,
 *                                                                        nombres de archivo y el mensaje del commit)
 */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { pathToFileURL } from "node:url";

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const NEW_KEY = /sb_(secret|publishable)_[A-Za-z0-9_-]{20,}/g;
const PERSONAL_TOKEN = /sbp_[0-9a-f]{40}/g;
const GIT_BUFFER = 1024 * 1024 * 1024;
// La salida de git no depende de la configuración de quien la corre (prefijos, color, firmas, conversores, renombres).
const GIT_LOG = ["-c", "core.quotePath=false", "log", "--patch", "--text", "--unified=0", "--inter-hunk-context=0",
  "--diff-merges=first-parent", "--no-renames", "--no-color", "--no-ext-diff", "--no-textconv", "--no-show-signature", "--src-prefix=a/",
  "--dst-prefix=b/", "--format=commit %H"];
// El mensaje entero (asunto y cuerpo) de cada commit, en UTF-8, como «hash\nmensaje» terminado en NUL (`git commit` no acepta un NUL
// en el mensaje).
const GIT_MESSAGES = ["log", "-z", "--format=%H%n%B", "--encoding=UTF-8", "--no-color", "--no-show-signature"];

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

/**
 * `text` con cada llave (y todo lo que tenga su forma) tapada como «llave»: una ruta o un mensaje de error puede traer la llave que se
 * informa. Se tapa la unión de lo que encuentra cada patrón, así una llave dentro de otra no deja a la vista ningún pedazo.
 */
function hideKeys(text) {
  const spans = [JWT, NEW_KEY, PERSONAL_TOKEN]
    .flatMap((pattern) => [...text.matchAll(pattern)].map((match) => [match.index, match.index + match[0].length]))
    .sort((a, b) => a[0] - b[0]);
  let shown = "";
  let at = 0;
  for (const [start, end] of spans) {
    if (start >= at) shown += `${text.slice(at, start)}«llave»`;
    at = Math.max(at, end);
  }
  return shown + text.slice(at);
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
 * Lanza si un directorio de la ruta de `file` es un enlace simbólico: seguirlo haría leer algo que git no versiona, quizá fuera del
 * repo (git nunca versiona un archivo detrás de un enlace, así que eso sólo pasa si alguien cambió el árbol de trabajo).
 */
function assertNoLinkInPath(cwd, file, checked) {
  for (let slash = file.indexOf("/"); slash !== -1; slash = file.indexOf("/", slash + 1)) {
    const directory = file.slice(0, slash);
    if (checked.has(directory)) continue;
    if (lstatSync(`${cwd}/${directory}`).isSymbolicLink()) {
      throw new Error(`${hideKeys(file)}: su ruta pasa por el enlace simbólico ${hideKeys(directory)} y la guarda no lo sigue`);
    }
    checked.add(directory);
  }
}

/**
 * Los hallazgos de los archivos versionados de `cwd`: en el contenido (`archivo:línea: tipo`), en el nombre o la ruta
 * (`archivo: tipo en el nombre`) y en el destino de un enlace simbólico (`enlace: tipo en el destino del enlace simbólico`). Ningún
 * archivo se salta por su tamaño ni por su codificación; uno que no se puede leer lanza (sólo se salta uno borrado en el árbol de
 * trabajo). Un enlace nunca se sigue.
 */
export function scanTrackedFiles(cwd = process.cwd()) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd, encoding: "utf8", maxBuffer: GIT_BUFFER }).split("\0").filter(Boolean);
  const report = [];
  const checked = new Set();
  for (const file of files) {
    const shown = hideKeys(file);
    for (const kind of keyKindsInLine(file)) report.push(`${shown}: ${kind} en el nombre`);
    let stats;
    try {
      assertNoLinkInPath(cwd, file, checked);
      stats = lstatSync(`${cwd}/${file}`);
    } catch (error) {
      if (error?.code === "ENOENT") continue; // borrado en el árbol de trabajo
      throw error;
    }
    if (stats.isSymbolicLink()) {
      // Lo que git guarda de un enlace es su destino: se lee sin seguirlo, colgante o no, dentro o fuera del repo.
      const target = readlinkSync(`${cwd}/${file}`, { encoding: "buffer" }).toString("latin1");
      for (const { kind } of findSupabaseKeys(target)) report.push(`${shown}: ${kind} en el destino del enlace simbólico`);
      continue;
    }
    // latin1: un byte, un carácter. Nada se reemplaza, así que una llave ASCII se ve aunque el archivo no sea UTF-8.
    for (const { line, kind } of findSupabaseKeys(readFileSync(`${cwd}/${file}`).toString("latin1"))) report.push(`${shown}:${line}: ${kind}`);
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

/** La ruta de `diff --git a/<ruta> b/<ruta>`: sin renombres, los dos lados traen la misma (entre comillas si git la escapa). */
function pathInDiffHeader(header) {
  const sides = header.slice("diff --git ".length);
  const path = sides.slice((sides.length + 1) / 2);
  return path.startsWith('"') ? path.slice(3, -1) : path.slice(2);
}

/**
 * Los hallazgos de lo que agrega cada commit de `base..cabeza`: las líneas que agrega (una fusión, contra su primer padre), como
 * `commit archivo:línea: tipo` con la línea del archivo en ese commit; el nombre y la ruta de cada archivo que queda en el commit
 * (agregado, cambiado o vacío; no uno borrado), como `commit archivo: tipo en el nombre`; y el mensaje de cada commit del rango, como
 * `commit (mensaje del commit):línea: tipo`.
 */
export function scanCommitRange(range, cwd = process.cwd()) {
  const [base, head] = resolveRange(range, cwd);
  const log = execFileSync("git", [...GIT_LOG, `${base}..${head}`, "--"], { cwd, maxBuffer: GIT_BUFFER });
  const report = [];
  let commit = "";
  let file = null;
  let header = null; // la línea `diff --git` del archivo en curso, mientras no se sepa que es un borrado
  let line = 0;
  let oldLeft = 0;
  let newLeft = 0;
  // El nombre se revisa al cerrar el bloque del archivo: hasta su segunda línea no se sabe si es un borrado, y un archivo vacío no
  // trae «+++».
  const closeFile = () => {
    if (header !== null) {
      const path = pathInDiffHeader(header);
      for (const kind of keyKindsInLine(path)) report.push(`${commit.slice(0, 12)} ${hideKeys(path)}: ${kind} en el nombre`);
    }
    header = null;
  };
  for (const text of bufferLines(log)) {
    if (oldLeft > 0 || newLeft > 0) {
      // Cuerpo de un bloque: se cuentan sus líneas con la cabecera @@, así una línea que empieza con «+++» o «commit» no confunde.
      if (text.startsWith("+") && newLeft > 0) {
        for (const kind of keyKindsInLine(text.slice(1))) report.push(`${commit.slice(0, 12)} ${hideKeys(String(file))}:${line}: ${kind}`);
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
      closeFile();
      commit = text.slice(7).trim();
      file = null;
    } else if (text.startsWith("diff --git ")) {
      closeFile();
      header = text;
      file = null;
    } else if (text.startsWith("deleted file mode ")) {
      header = null; // borrar un archivo no agrega su nombre
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
  closeFile();
  // Todo commit del rango se publica con su mensaje: también una fusión y los commits que trae.
  const messages = execFileSync("git", [...GIT_MESSAGES, `${base}..${head}`, "--"], { cwd, maxBuffer: GIT_BUFFER }).toString("latin1");
  for (const entry of messages.split("\0")) {
    const newline = entry.indexOf("\n");
    if (newline === -1) continue;
    const hash = entry.slice(0, newline);
    for (const found of findSupabaseKeys(entry.slice(newline + 1))) {
      report.push(`${hash.slice(0, 12)} (mensaje del commit):${found.line}: ${found.kind}`);
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
      where = "los archivos versionados (contenido, nombres y enlaces)";
    } else if (args.length === 2 && args[0] === "--rango") {
      report = scanCommitRange(args[1]);
      where = `lo que agrega ${args[1]} (líneas, nombres de archivo y mensajes de commit)`;
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
    console.error(hideKeys(error instanceof Error ? error.message : String(error)));
    process.exit(2);
  }
}
