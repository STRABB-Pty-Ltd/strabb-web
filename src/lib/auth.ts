import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { TokenPair } from "@/types/auth";

import { decodeJwtPayload, isTokenExpiringSoon } from "./auth-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return (await response.json()) as TokenPair;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const tokens: TokenPair = await response.json();
        const payload = decodeJwtPayload(tokens.access_token);

        return {
          id: payload.sub,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tenantId: payload.tenant_id,
          userId: payload.sub,
          accessTokenExpires: payload.exp,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: copy tokens from user into JWT
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          tenantId: user.tenantId,
          userId: user.userId,
          accessTokenExpires: user.accessTokenExpires,
        };
      }

      // Subsequent requests: check if access token needs refresh
      if (!isTokenExpiringSoon(token.accessTokenExpires)) {
        return token;
      }

      // Access token expired or expiring soon — refresh it
      try {
        const tokens = await refreshAccessToken(token.refreshToken);
        const payload = decodeJwtPayload(tokens.access_token);

        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          accessTokenExpires: payload.exp,
          error: undefined,
        };
      } catch {
        return {
          ...token,
          error: "RefreshTokenError" as const,
        };
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.tenantId = token.tenantId;
      session.userId = token.userId;
      session.error = token.error;
      return session;
    },
  },
});
