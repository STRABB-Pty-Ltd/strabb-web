import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { CurrentUser, CurrentUserResponse, DataResponse, TokenPair } from "@/types/auth";

import { decodeJwtPayload, isTokenExpiringSoon } from "./auth-utils";

const API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

// The refresh token itself was rejected (revoked, rotated away, or the dev
// DB was re-seeded). Distinct from transient failures (backend down, 5xx)
// so a one-off hiccup never logs anyone out.
class FatalRefreshError extends Error {}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      throw new FatalRefreshError(`Refresh rejected (${response.status})`);
    }
    throw new Error(`Refresh failed (${response.status})`);
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

const IS_DEV_SESSION = process.env.NODE_ENV === "development";

if (IS_DEV_SESSION) {
  console.warn("[auth] DEV-ONLY: session.maxAge bumped to 30 days. Production uses 1 day.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: IS_DEV_SESSION ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
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

      // Access token expired or expiring soon - refresh it
      let tokens: TokenPair;
      try {
        tokens = await refreshAccessToken(token.refreshToken);
      } catch (err) {
        if (err instanceof FatalRefreshError) {
          // Dead refresh token: flag it and let SessionGuard sign the user
          // out, instead of leaving a zombie session that renders every page
          // authenticated-but-empty.
          return {
            ...token,
            error: "RefreshTokenError" as const,
          };
        }
        // Transient (backend restarting / network blip): keep the session
        // untouched and retry on the next request.
        return token;
      }

      // Tokens rotated successfully; from here the session must keep the new
      // pair even if the profile re-fetch below fails (the old refresh token
      // is already revoked by the rotation).
      const payload = decodeJwtPayload(tokens.access_token);
      const rotated = {
        ...token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpires: payload.exp,
        error: undefined,
      };

      try {
        const currentUser = await fetchCurrentUser(tokens.access_token);
        return {
          ...rotated,
          tenantId: currentUser.tenantId,
          userId: currentUser.id,
          role: currentUser.role,
          currentUser,
        };
      } catch {
        // Profile refresh is cosmetic - keep the rotated tokens and the
        // cached currentUser rather than discarding a live session.
        return rotated;
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      // refreshToken intentionally NOT exposed to client session - stays server-side in JWT only
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
