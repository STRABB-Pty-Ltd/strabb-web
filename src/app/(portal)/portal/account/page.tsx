"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function PortalAccountPage() {
  const { currentUser } = useCurrentUser();

  return (
    <div className="space-y-md">
      <h1 className="text-heading text-highlight-10 font-semibold">Account</h1>

      <div className="p-md space-y-sm rounded-lg" style={{ backgroundColor: "var(--neutral-30)" }}>
        <div>
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            Name
          </p>
          <p className="text-body text-highlight-10 font-medium">{currentUser?.fullName ?? "-"}</p>
        </div>
        <div>
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            Email
          </p>
          <p className="text-body text-highlight-10 font-medium">{currentUser?.email ?? "-"}</p>
        </div>
      </div>

      <Button
        type="button"
        variant="destructive"
        onClick={() => void signOut({ callbackUrl: "/login" })}
        className="min-h-[var(--touch-target-min)] w-full font-semibold"
      >
        Sign out
      </Button>
    </div>
  );
}
