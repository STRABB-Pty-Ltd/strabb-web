"use client";

import { Cog, Share2, Zap } from "lucide-react";
import Link from "next/link";

import { useAppStore } from "@/stores/app-store";

export function ActionsSection() {
  const openSharePopup = useAppStore((s) => s.openSharePopup);

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Actions
      </h3>
      <div className="gap-xs flex flex-col">
        <button
          type="button"
          onClick={openSharePopup}
          className="gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: "var(--neutral-30)",
            color: "var(--highlight-10)",
          }}
        >
          <Share2 size={13} />
          Share
        </button>
        <Link
          href="/settings/listings"
          className="gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: "var(--neutral-30)",
            color: "var(--highlight-10)",
          }}
        >
          <Cog size={13} aria-hidden="true" />
          Configure
        </Link>
        <button
          type="button"
          disabled
          className="gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: "var(--neutral-30)",
            color: "var(--highlight-10)",
            opacity: 0.6,
          }}
        >
          <Zap size={13} aria-hidden="true" />
          Automations
        </button>
      </div>
    </div>
  );
}
