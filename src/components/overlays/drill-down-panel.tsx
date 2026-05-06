"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { Z } from "@/lib/z-index";

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
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the panel mounted briefly after close so slideOutRight can play.
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  useClickOutside(panelRef, onClose, open);

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
      {/* Scrim - canvas-bounded so the rails stay live. Click anywhere on
          the wash to dismiss. */}
      <div
        style={{
          ...canvasOverlayStyle,
          zIndex: Z.DRAWER_SCRIM,
          backgroundColor: "var(--scrim)",
        }}
        onClick={onClose}
      />

      {/* Panel - canvas-bounded: top aligns with canvas content top so the
          panel never protrudes into the topnav/submenu. Right + bottom
          inset by --space-md to match canvas content padding from screen edges. */}
      <div
        ref={panelRef}
        className="fixed flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          zIndex: Z.DRAWER,
          top: "calc(var(--canvas-top) + var(--space-md) - 2px)",
          right: "var(--space-md)",
          bottom: "var(--space-md)",
          width: "var(--drilldown-width)",
          animation: !open
            ? `slideOutRight ${EXIT_MS}ms ease-in forwards`
            : `slideInRight ${EXIT_MS}ms ease-out`,
        }}
      >
        {/* Accent bar */}
        <div
          className="shrink-0"
          style={{ height: "var(--space-base)", backgroundColor: accentColor }}
        />

        {/* Header */}
        <div
          className="px-sm py-sm flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-body font-semibold text-highlight-10">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-xs rounded text-highlight-10 hover:bg-neutral-30 hover:text-highlight-10"
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
