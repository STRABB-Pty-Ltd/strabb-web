"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";

import { useDelayedClose } from "@/hooks/use-delayed-close";

interface DrillDownPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}

const EXIT_MS = 300;

export function DrillDownPanel({
  open,
  onClose,
  title,
  accentColor = "var(--strabb-secondary)",
  children,
}: DrillDownPanelProps) {
  // Keep the panel mounted briefly after close so slideOutRight can play.
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Click-outside area */}
      <div className="fixed inset-0 z-[140]" onClick={onClose} />

      {/* Panel - floats inset from the viewport edges with rounded corners */}
      <div
        className="fixed z-[150] flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          top: "var(--space-md)",
          right: "var(--space-md)",
          bottom: "var(--space-md)",
          width: "var(--drilldown-width)",
          animation: !open
            ? `slideOutRight ${EXIT_MS}ms ease forwards`
            : `slideInRight ${EXIT_MS}ms ease`,
        }}
      >
        {/* Accent bar */}
        <div className="shrink-0" style={{ height: 8, backgroundColor: accentColor }} />

        {/* Header */}
        <div
          className="px-sm py-sm flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-body font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-xs rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-no-elevate
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-sm flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
