import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/**
 * Owner, entrada 104 (decisión 3) y entrada 111 («Todo problema de seguridad SE ARREGLA»); revisión 111, SF6. Desde la migración de la
 * Suite 20261113060000 la llave publicable (rol anon) sólo lee de `user_sites` las cuatro columnas que el middleware usa para traducir
 * un dominio propio verificado a su subdominio: `subdomain`, `custom_domain`, `domain_verified`, `is_active` (y desde 20261113061000,
 * sólo las filas verificadas y activas). Todo lo demás de CBF lee `user_sites` con el cliente de servicio. Si esta prueba falla, código
 * que sí se construye (app/, lib/, middleware.ts; src/ no está en el build porque existe app/) lee `user_sites` con la llave publicable
 * fuera del middleware, o el middleware pide o filtra otra columna: en producción esa lectura respondería «permission denied» y el
 * dominio propio dejaría de resolver.
 */
const PERMITIDAS = new Set(["subdomain", "custom_domain", "domain_verified", "is_active"]);
const raiz = new URL("..", import.meta.url).pathname;

function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : archivos(path);
    return /\.(ts|tsx)$/.test(e.name) ? [path] : [];
  });
}

test("en lo que se construye, sólo el middleware lee user_sites con la llave publicable, y sólo las cuatro columnas que la Suite le deja", () => {
  const construidos = ["app", "lib", "middleware.ts"].flatMap((d) => {
    const path = join(raiz, d);
    return statSync(path).isDirectory() ? archivos(path) : [path];
  });
  const conPublicable = construidos.filter((path) => {
    const fuente = readFileSync(path, "utf8");
    return /from\s+["']@\/lib\/supabase\/server["']/.test(fuente) && /from\(\s*["']user_sites["']\s*\)/.test(fuente);
  }).map((path) => relative(raiz, path));
  assert.deepEqual(conPublicable, ["middleware.ts"], "un lector nuevo de user_sites con la llave publicable: muévelo al cliente de servicio");

  const fuente = readFileSync(join(raiz, "middleware.ts"), "utf8");
  const consultas = [...fuente.matchAll(/from\(\s*["']user_sites["']\s*\)([\s\S]*?)(?:;|\n\s*\n)/g)].map((m) => m[1]);
  assert.equal(consultas.length, 1, "el middleware hace una sola consulta a user_sites");
  const columnas = new Set();
  for (const m of consultas[0].matchAll(/\.select\(\s*["'`]([^"'`]*)["'`]/g)) m[1].split(",").forEach((c) => columnas.add(c.trim()));
  for (const m of consultas[0].matchAll(/\.(?:eq|neq|in|is|ilike|like|gt|gte|lt|lte|match|filter|or)\(\s*["'`]([^"'`,]+)["'`]/g)) columnas.add(m[1].trim());
  assert.ok(columnas.size > 0);
  for (const columna of columnas) assert.ok(PERMITIDAS.has(columna), `el middleware lee o filtra «${columna}» con la llave publicable`);
  assert.deepEqual([...columnas].sort(), ["custom_domain", "domain_verified", "is_active", "subdomain"]);
});
