/**
 * Session/JWT error sentinel set by the auth.ts jwt callback when a token
 * refresh fails fatally (refresh token revoked, rotated away, or the transient
 * grace window below was exhausted). Consumed server-side by middleware
 * (routing), client-side by SessionGuard (sign-out), and by the auth-ready
 * query gate. One shared constant so the producer and every consumer cannot
 * drift on the literal.
 */
export const REFRESH_TOKEN_ERROR = "RefreshTokenError" as const;

export type RefreshTokenErrorFlag = typeof REFRESH_TOKEN_ERROR;

/**
 * How long the session tolerates consecutive transient refresh failures
 * (backend down / 5xx / network) before giving up and signing out. Bounds the
 * "keep the session and retry" path so a prolonged refresh outage eventually
 * ends the session instead of looping forever with an expired access token.
 */
export const REFRESH_FAILURE_GRACE_MS = 5 * 60 * 1000;
