import type { TokenPair } from "@/types/auth";

import { isFatalRefreshStatus } from "./auth-utils";

const API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

/**
 * The refresh token itself was rejected (revoked, rotated away, or the dev DB
 * was re-seeded). Distinct from transient failures (backend down, 5xx) so a
 * one-off hiccup never logs anyone out. Consumed by the auth.ts jwt callback,
 * which signs out only on this class.
 */
export class FatalRefreshError extends Error {}

/**
 * Single-flight dedupe map, keyed by the presented refresh token.
 *
 * NextAuth runs the jwt callback once per concurrent request, so several tabs
 * or in-flight requests that hit an expiring access token at the same instant
 * would each fire their own POST /auth/refresh. Refresh tokens ROTATE - the
 * backend revokes the token it was handed and issues a new pair - so only the
 * first of those parallel calls succeeds; every other call presents the
 * now-revoked token, gets a fatal 401, and the session is torn down mid-use.
 * That race is the worst known UX defect. Collapsing overlapping refreshes of
 * the same token into one shared request+promise removes it.
 */
const inflightRefresh = new Map<string, Promise<TokenPair>>();

async function requestRefresh(refreshToken: string): Promise<TokenPair> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    if (isFatalRefreshStatus(response.status)) {
      throw new FatalRefreshError(`Refresh rejected (${response.status})`);
    }
    throw new Error(`Refresh failed (${response.status})`);
  }

  return (await response.json()) as TokenPair;
}

/**
 * Refresh the access token, deduping concurrent calls for the same refresh
 * token so exactly one /auth/refresh is issued and every caller receives the
 * same rotated pair. The in-flight entry is cleared once the request settles -
 * on success AND on failure - so a rejected attempt is never cached: the next
 * caller starts a fresh request instead of re-awaiting a stale rejection.
 */
export function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const existing = inflightRefresh.get(refreshToken);
  if (existing) return existing;

  const promise = requestRefresh(refreshToken).finally(() => {
    inflightRefresh.delete(refreshToken);
  });

  inflightRefresh.set(refreshToken, promise);
  return promise;
}
