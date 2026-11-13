#!/usr/bin/env node
/**
 * Falla si un archivo versionado trae una llave de Supabase: una JWT heredada de un proyecto (anon o service_role, `iss`
 * = "supabase") o una llave nueva (`sb_secret_…`, `sb_publishable_…`). Nunca imprime la llave: sólo archivo, línea y tipo.
 *
 * Por qué (2026-11-13): `check-remote-migrations.mjs` (commit 81905bd, 2026-05-30) traía escrita la service_role heredada de la
 * Suite en este repo PÚBLICO: con ella cualquiera ignora toda la RLS. CBF lee sus llaves sólo del entorno (Vercel); ninguna llave,
 * ni la pública, va en el código.
 *
 * Uso: node scripts/check-no-supabase-keys.mjs        (revisa `git ls-files` del directorio actual)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const NEW_KEY = /sb_(secret|publishable)_[A-Za-z0-9_-]{20,}/g;
const MAX_BYTES = 5 * 1024 * 1024;

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

/** Las llaves de Supabase de un texto, como `{ line, kind }`. Nunca devuelve el valor. */
export function findSupabaseKeys(text) {
  const found = [];
  text.split(/\r?\n/).forEach((content, index) => {
    for (const match of content.matchAll(JWT)) {
      const kind = supabaseJwtKind(match[0]);
      if (kind) found.push({ line: index + 1, kind });
    }
    for (const match of content.matchAll(NEW_KEY)) found.push({ line: index + 1, kind: `sb_${match[1]}` });
  });
  return found;
}

/** Los hallazgos de los archivos versionados de `cwd`, como líneas `archivo:línea: tipo`. */
export function scanTrackedFiles(cwd = process.cwd()) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).split("\0").filter(Boolean);
  const report = [];
  for (const file of files) {
    let buffer;
    try {
      if (statSync(`${cwd}/${file}`).size > MAX_BYTES) continue;
      buffer = readFileSync(`${cwd}/${file}`);
    } catch {
      continue; // borrado en el árbol de trabajo
    }
    if (buffer.subarray(0, 4096).includes(0)) continue; // binario
    for (const { line, kind } of findSupabaseKeys(buffer.toString("utf8"))) report.push(`${file}:${line}: ${kind}`);
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = scanTrackedFiles();
  if (report.length > 0) {
    console.error("Llaves de Supabase versionadas (sácalas del código, ponlas en el entorno y rota la que se haya publicado):");
    for (const line of report) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log("Sin llaves de Supabase en los archivos versionados.");
}
