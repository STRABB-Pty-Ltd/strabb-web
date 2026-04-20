"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";

interface DrillDownPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}

export function DrillDownPanel({
  open,
  onClose,
  title,
  accentColor = "var(--strabb-secondary)",
  children,
}: DrillDownPanelProps) {
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

  if (!open) return null;

  return (
    <>
      {/* Click-outside area */}
      <div className="fixed inset-0 z-[140]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 z-[150] flex h-full flex-col bg-white shadow-xl"
        style={{
          width: "var(--drilldown-width)",
          animation: "slideInRight 300ms ease",
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
            className="p-xs rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
