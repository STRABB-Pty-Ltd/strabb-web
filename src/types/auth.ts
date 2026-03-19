/** Backend login/refresh response shape. */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Decoded JWT payload claims from the backend access/refresh token. */
export interface JwtPayload {
  sub: string; // user_id UUID
  tenant_id: string; // UUID
  token_type: "access" | "refresh";
  exp: number;
  iat: number;
}
