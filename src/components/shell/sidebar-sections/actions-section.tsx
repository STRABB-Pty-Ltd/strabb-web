"use client";

import { Cog, Share2, Zap } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

export function ActionsSection() {
  const openSharePopup = useAppStore((s) => s.openSharePopup);

  return (
    <div style={{ padding: "var(--space-md)" }}>
      <h3
        className="mb-2 text-xs font-semibold tracking-wide uppercase"
        style={{ color: "var(--brand-10)", opacity: 0.7 }}
      >
        Actions
      </h3>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={openSharePopup}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
          }}
        >
          <Share2 size={16} />
          Share
        </button>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
            opacity: 0.6,
          }}
        >
          <Cog size={16} />
          Configure
        </button>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
            opacity: 0.6,
          }}
        >
          <Zap size={16} />
          Automations
        </button>
      </div>
    </div>
  );
}
