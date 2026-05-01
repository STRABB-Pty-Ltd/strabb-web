"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

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
  // Keep the panel mounted briefly after `open` flips to false so the
  // slideOutRight animation can play before unmount. Without this the
  // panel disappears instantly on close, which feels jarring against
  // the slide-in entrance. Only run the exit animation if the panel was
  // actually opened first - otherwise initial open=false would briefly
  // render the panel.
  const [exiting, setExiting] = useState(false);
  const wasOpened = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpened.current = true;
      setExiting(false);
    } else if (wasOpened.current) {
      setExiting(true);
      const t = setTimeout(() => setExiting(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

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

  if (!open && !exiting) return null;

  return (
    <>
      {/* Click-outside area */}
      <div className="fixed inset-0 z-[140]" onClick={onClose} />

      {/* Panel - floats inset from the viewport edges with rounded corners */}
      <div
        className="rounded-2xl fixed z-[150] flex flex-col overflow-hidden bg-white shadow-xl"
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
