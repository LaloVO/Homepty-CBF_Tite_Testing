import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

function routeFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

const PUBLIC_OR_RETIRED_CBF_ROUTES = new Set([
  "app/api/cbf/admin/create-site/route.ts",
  "app/api/cbf/analytics/track/route.ts",
  "app/api/cbf/health/route.ts",
  "app/api/cbf/projects/intake/route.ts",
  "app/api/cbf/setup-site/route.ts",
  "app/api/cbf/templates/route.ts",
]);

test("every new CBF route must use the central site authentication boundary", () => {
  const missingAuth = routeFiles(join(ROOT, "app/api/cbf"))
    .map((path) => relative(ROOT, path))
    .filter((path) => !PUBLIC_OR_RETIRED_CBF_ROUTES.has(path))
    .filter((path) => !readFileSync(join(ROOT, path), "utf8").includes("authMiddleware("));

  assert.deepEqual(missingAuth, []);
});

test("every internal site-order route requires an internal credential", () => {
  const missingAuth = routeFiles(join(ROOT, "app/api/internal/site-orders"))
    .map((path) => relative(ROOT, path))
    .filter((path) => !readFileSync(join(ROOT, path), "utf8").includes("hasInternalCredential("));

  assert.deepEqual(missingAuth, []);
});

test("the public health route never exposes environment or database error details", () => {
  const health = readFileSync(join(ROOT, "app/api/cbf/health/route.ts"), "utf8");
  for (const forbidden of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "error?.message",
    "cbf_api_key",
  ]) {
    assert.equal(health.includes(forbidden), false, forbidden);
  }
});

test("site configuration is resolved by authenticated site id, not only by owner", () => {
  const userRoute = readFileSync(join(ROOT, "app/api/cbf/user/route.ts"), "utf8");
  assert.equal(userRoute.includes('const { siteId, userId } = authResult'), true);
  assert.equal(userRoute.includes('.eq("id", siteId)'), true);
  assert.equal(userRoute.includes('.eq("user_id_supabase", userId)'), false);
});
