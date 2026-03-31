"use client";

import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    status,
    isAuthenticated: status === "authenticated",
    currentUser: session?.currentUser ?? null,
    role: session?.role ?? null,
  };
}
