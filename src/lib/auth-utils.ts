import type { JwtPayload } from "@/types/auth";

/**
 * Decode the payload segment of a JWT without verifying the signature.
 * Used client-side to extract claims (sub, tenant_id, exp) from the token
 * that Auth.js stores in the session. Signature verification is handled
 * by the backend - this is only for reading claims.
 */
export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 segments");
  }

  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded) as JwtPayload;
}

/**
 * Check whether a JWT's exp claim is within `bufferSeconds` of expiring.
 * Returns true if the token should be refreshed.
 */
export function isTokenExpiringSoon(exp: number, bufferSeconds = 60): boolean {
  return Date.now() / 1000 > exp - bufferSeconds;
}

/**
 * Statuses from /auth/refresh that are transient (a retry can clear them)
 * rather than a rejected refresh token: 408 Request Timeout, 425 Too Early,
 * 429 Too Many Requests. Treated like 5xx / network errors, not a fatal logout.
 */
const TRANSIENT_REFRESH_STATUSES = new Set([408, 425, 429]);

/**
 * Whether a non-ok /auth/refresh response means the refresh token itself is
 * dead (fatal, sign out) rather than a transient blip. Only a non-transient 4xx
 * is fatal; 5xx and the transient 4xx codes fall through to keep-and-retry.
 * Callers pass a status already known to be non-ok, so the bound is just
 * "client error and not transient".
 */
export function isFatalRefreshStatus(status: number): boolean {
  return status < 500 && !TRANSIENT_REFRESH_STATUSES.has(status);
}
