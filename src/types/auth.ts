/** Backend login/refresh response shape. */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type UserRole = "admin" | "owner" | "cleaner";

export interface CurrentUserResponse {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface CurrentUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface DataResponse<T> {
  data: T;
}

/** Decoded JWT payload claims from the backend access/refresh token. */
export interface JwtPayload {
  sub: string; // user_id UUID
  tenant_id: string; // UUID
  token_type: "access" | "refresh";
  exp: number;
  iat: number;
}
