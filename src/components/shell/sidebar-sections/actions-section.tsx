"use client";

import { Cog, Share2, Zap } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

export function ActionsSection() {
  const openSharePopup = useAppStore((s) => s.openSharePopup);

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--brand-10)", opacity: 0.7 }}
      >
        Actions
      </h3>
      <div className="gap-xs flex flex-col">
        <button
          type="button"
          onClick={openSharePopup}
          className="gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
          }}
        >
          <Share2 size={13} />
          Share
        </button>
        <button
          type="button"
          disabled
          className="gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
            opacity: 0.6,
          }}
        >
          <Cog size={13} />
          Configure
        </button>
        <button
          type="button"
          disabled
          className="gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
            opacity: 0.6,
          }}
        >
          <Zap size={13} />
          Automations
        </button>
      </div>
    </div>
  );
}
