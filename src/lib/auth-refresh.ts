import type { TokenPair } from "@/types/auth";

import { isFatalRefreshStatus } from "./auth-utils";

const API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

// The refresh token itself was rejected (revoked, rotated away, or the dev
// DB was re-seeded). Distinct from transient failures (backend down, 5xx)
// so a one-off hiccup never logs anyone out.
export class FatalRefreshError extends Error {}

async function performRefresh(refreshToken: string): Promise<TokenPair> {
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

// In-flight refresh calls, keyed by refresh token. The NextAuth jwt callback
// can run concurrently for the same session (multiple tabs each holding an
// expiring access token fire their own refresh at roughly the same moment),
// and the backend rotates the refresh token on every use. Without dedupe,
// the loser of that race presents the token the winner just rotated away,
// gets a fatal rejection, and forces a sign-out - the multi-tab logout bug.
// Single-flighting collapses concurrent callers onto one real HTTP call and
// one shared rotated pair.
//
// This covers the dominant case: one Node process per web instance, so a
// race between browser tabs hits the same process. It does NOT cover a
// race across multiple web replicas (each process has its own map) - the
// durable cross-process fix is an api-side reuse-grace window accepting a
// just-rotated-away refresh token for a short window, which is a backend
// change out of scope here. Revisit if forced-logout reports persist after
// this lands.
const inflightRefresh = new Map<string, Promise<TokenPair>>();

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const existing = inflightRefresh.get(refreshToken);
  if (existing) {
    return existing;
  }

  const promise = performRefresh(refreshToken).finally(() => {
    inflightRefresh.delete(refreshToken);
  });
  inflightRefresh.set(refreshToken, promise);
  return promise;
}
