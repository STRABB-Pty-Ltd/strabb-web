"use client";

import { Cog, Share2, Zap } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

/* Overrides that keep the pre-primitive sidebar row geometry: natural
   height (py-base, not the fixed h-lg), left-aligned content, borderless
   fill, and the original colour-only transition. */
const actionRowClass = "h-auto justify-start gap-base border-0 px-sm py-base transition-colors";

export function ActionsSection() {
  const openSharePopup = useAppStore((s) => s.openSharePopup);

  return (
    <div className="p-sm">
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Actions
      </h3>
      <div className="gap-xs flex flex-col">
        <Button
          type="button"
          variant="secondary"
          onClick={openSharePopup}
          className={actionRowClass}
        >
          <Share2 size={13} />
          Share
        </Button>
        <Link
          href="/settings/listings"
          className={cn(buttonVariants({ variant: "secondary" }), actionRowClass)}
        >
          <Cog size={13} aria-hidden="true" />
          Configure
        </Link>
        <Link
          href="/messaging/templates"
          className={cn(buttonVariants({ variant: "secondary" }), actionRowClass)}
        >
          <Zap size={13} aria-hidden="true" />
          Automations
        </Link>
      </div>
    </div>
  );
}
