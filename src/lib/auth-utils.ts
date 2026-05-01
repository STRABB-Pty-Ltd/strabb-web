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
