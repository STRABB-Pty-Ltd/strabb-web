"use client";

import { Cog, Share2, Zap } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

export function ActionsSection() {
  const openSharePopup = useAppStore((s) => s.openSharePopup);

  return (
    <div style={{ padding: "var(--space-md)" }}>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Actions
      </h3>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={openSharePopup}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Share2 size={16} />
          Share
        </button>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400"
        >
          <Cog size={16} />
          Configure
        </button>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400"
        >
          <Zap size={16} />
          Automations
        </button>
      </div>
    </div>
  );
}
