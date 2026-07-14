"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";

/* Account block - who is signed in + the way out. This is the app's only
   sign-out control (the top-nav button moved here, I.3 13-07-2026); it
   mirrors the portal account page's signOut and lands back on /login. */
export function AccountSection() {
  const { currentUser } = useCurrentUser();

  return (
    <div className="space-y-sm">
      <div>
        <h3 className="text-body text-highlight-10 font-semibold">Account</h3>
        <p className="text-body text-highlight-10">You are signed in as</p>
      </div>

      <Card variant="filled" padding="sm" className="w-fit min-w-[233px] gap-0">
        <p className="text-body text-highlight-10 font-medium">{currentUser?.fullName ?? "-"}</p>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          {currentUser?.email ?? "-"}
        </p>
      </Card>

      <Button variant="destructive" onClick={() => void signOut({ callbackUrl: "/login" })}>
        Sign out
      </Button>
    </div>
  );
}
