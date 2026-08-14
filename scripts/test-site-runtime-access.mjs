import assert from "node:assert/strict";
import test from "node:test";

import {
  isLegacyGrantActive,
  resolveSiteRuntimeAccess,
} from "../lib/site-runtime-access.ts";

test("active and grace sites keep their normal CBF access", () => {
  for (const lifecycleStatus of ["active", "grace", null]) {
    assert.deepEqual(
      resolveSiteRuntimeAccess({
        isActive: true,
        lifecycleStatus,
        hasActiveLegacyGrant: false,
      }),
      { allowed: true, basis: "lifecycle" }
    );
  }
});

test("a legacy grant is a first-class contract for an active pending site", () => {
  assert.deepEqual(
    resolveSiteRuntimeAccess({
      isActive: true,
      lifecycleStatus: "pending",
      hasActiveLegacyGrant: true,
    }),
    { allowed: true, basis: "legacy_grant" }
  );
});

test("pending sites without a legacy contract remain blocked", () => {
  assert.deepEqual(
    resolveSiteRuntimeAccess({
      isActive: true,
      lifecycleStatus: "pending",
      hasActiveLegacyGrant: false,
    }),
    { allowed: false, basis: null }
  );
});

test("suspended or inactive sites remain blocked even with a legacy grant", () => {
  for (const input of [
    { isActive: true, lifecycleStatus: "suspended" },
    { isActive: false, lifecycleStatus: "pending" },
  ]) {
    assert.deepEqual(
      resolveSiteRuntimeAccess({ ...input, hasActiveLegacyGrant: true }),
      { allowed: false, basis: null }
    );
  }
});

test("revoked, future and expired grants do not authorize a site", () => {
  const now = Date.parse("2026-08-14T12:00:00Z");
  assert.equal(
    isLegacyGrantActive({ valid_from: "2026-08-01T00:00:00Z", valid_until: null, revoked_at: null }, now),
    true
  );
  assert.equal(
    isLegacyGrantActive({ valid_from: "2026-08-01T00:00:00Z", valid_until: null, revoked_at: "2026-08-10T00:00:00Z" }, now),
    false
  );
  assert.equal(
    isLegacyGrantActive({ valid_from: "2026-08-15T00:00:00Z", valid_until: null, revoked_at: null }, now),
    false
  );
  assert.equal(
    isLegacyGrantActive({ valid_from: "2026-08-01T00:00:00Z", valid_until: "2026-08-14T11:00:00Z", revoked_at: null }, now),
    false
  );
});
