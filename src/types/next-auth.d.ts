import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    userId: string;
    error?: "RefreshTokenError";
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    userId: string;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    userId: string;
    accessTokenExpires: number;
    error?: "RefreshTokenError";
  }
}
