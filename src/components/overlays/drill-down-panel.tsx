"use client";

import { useId, useRef } from "react";
import { X } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useFocusTrap } from "@/hooks/use-focus-trap";
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
  accentColor = "var(--highlight-10)",
  children,
}: DrillDownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Keep the panel mounted briefly after close so slideOutRight can play.
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  useClickOutside(panelRef, onClose, open);
  // Side drawer: rails stay live, so we don't aria-modal or trap Tab inside.
  // The hook still moves focus into the panel on open and restores it on close.
  useFocusTrap(panelRef, { active: open, onEscape: onClose, trap: false });

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
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
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
          <h2 id={titleId} className="text-body text-highlight-10 font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-xs text-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
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
