import "next-auth";
import "next-auth/jwt";

import type { CurrentUser, UserRole } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    tenantId: string;
    userId: string;
    role: UserRole;
    currentUser: CurrentUser;
    error?: "RefreshTokenError";
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    userId: string;
    role: UserRole;
    currentUser: CurrentUser;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    userId: string;
    role: UserRole;
    currentUser: CurrentUser;
    accessTokenExpires: number;
    error?: "RefreshTokenError";
  }
}
