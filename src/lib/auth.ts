import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { CurrentUser, CurrentUserResponse, DataResponse, TokenPair } from "@/types/auth";

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

async function fetchCurrentUser(accessToken: string): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load current user");
  }

  const payload = (await response.json()) as DataResponse<CurrentUserResponse>;
  return {
    id: payload.data.id,
    tenantId: payload.data.tenant_id,
    email: payload.data.email,
    fullName: payload.data.full_name,
    role: payload.data.role,
    isActive: payload.data.is_active,
  };
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
        const currentUser = await fetchCurrentUser(tokens.access_token);

        return {
          id: currentUser.id,
          name: currentUser.fullName,
          email: currentUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tenantId: currentUser.tenantId,
          userId: currentUser.id,
          role: currentUser.role,
          currentUser,
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
          role: user.role,
          currentUser: user.currentUser,
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
        const currentUser = await fetchCurrentUser(tokens.access_token);

        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tenantId: currentUser.tenantId,
          userId: currentUser.id,
          role: currentUser.role,
          currentUser,
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
      session.role = token.role;
      session.currentUser = token.currentUser;
      session.user = {
        ...session.user,
        email: token.currentUser.email,
        name: token.currentUser.fullName,
      };
      session.error = token.error;
      return session;
    },
  },
});
