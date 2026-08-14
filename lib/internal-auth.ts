import "server-only";
import { timingSafeEqual } from "node:crypto";

export type InternalCredential =
  | "CBF_FACTORY_READ_KEY"
  | "CBF_FACTORY_STATUS_KEY"
  | "CBF_PROVISION_KEY";

function safeEqual(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hasInternalCredential(request: Request, credential: InternalCredential): boolean {
  const expected = process.env[credential];
  const authorization = request.headers.get("authorization");
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  return safeEqual(authorization.slice(7), expected);
}
