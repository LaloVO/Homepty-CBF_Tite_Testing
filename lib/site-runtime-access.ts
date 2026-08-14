export type SiteLifecycleStatus = "pending" | "active" | "grace" | "suspended" | null;

export type SiteAccessBasis = "lifecycle" | "legacy_grant";

export type SiteRuntimeDecision =
  | { allowed: true; basis: SiteAccessBasis }
  | { allowed: false; basis: null };

export type LegacyGrantWindow = {
  valid_from: string;
  valid_until: string | null;
  revoked_at: string | null;
};

export function isLegacyGrantActive(
  grant: LegacyGrantWindow | null,
  now = Date.now()
): boolean {
  if (!grant || grant.revoked_at) return false;

  const validFrom = Date.parse(grant.valid_from);
  const validUntil = grant.valid_until ? Date.parse(grant.valid_until) : null;
  if (!Number.isFinite(validFrom) || validFrom > now) return false;
  return validUntil === null || (Number.isFinite(validUntil) && validUntil > now);
}

export function resolveSiteRuntimeAccess(input: {
  isActive: boolean;
  lifecycleStatus: SiteLifecycleStatus;
  hasActiveLegacyGrant: boolean;
}): SiteRuntimeDecision {
  if (!input.isActive || input.lifecycleStatus === "suspended") {
    return { allowed: false, basis: null };
  }

  // Null preserves compatibility with installations created before lifecycle_status.
  if (input.lifecycleStatus === null || ["active", "grace"].includes(input.lifecycleStatus)) {
    return { allowed: true, basis: "lifecycle" };
  }

  // A legacy grant is a first-class site contract, not a per-site exception.
  if (input.lifecycleStatus === "pending" && input.hasActiveLegacyGrant) {
    return { allowed: true, basis: "legacy_grant" };
  }

  return { allowed: false, basis: null };
}
