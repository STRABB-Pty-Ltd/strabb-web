"use client";

import { useId, useRef } from "react";
import { X } from "lucide-react";

import { TicketForm } from "@/components/tickets/ticket-form";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { Z } from "@/lib/z-index";

interface TicketDrawerProps {
  open: boolean;
  onClose: () => void;
}

const EXIT_MS = 200;

export function TicketDrawer({ open, onClose }: TicketDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  useClickOutside(panelRef, onClose, open);
  // Side drawer: rails stay live, no Tab trap. App-shell handles Esc globally.
  useFocusTrap(panelRef, { active: open, trap: false });

  // Escape key is handled by the global keyboard shortcuts in app-shell.tsx

  if (!shouldRender) return null;

  return (
    <>
      {/* Scrim - canvas-bounded; sits under the thread scrim so the thread
          overlay stays on top. Clicking outside the panel closes the drawer. */}
      <div
        onClick={onClose}
        style={{
          ...canvasOverlayStyle,
          zIndex: Z.DRAWER_SCRIM,
          backgroundColor: "var(--scrim)",
          animation: !open
            ? `fadeOut ${EXIT_MS}ms ease-in forwards`
            : `fadeIn ${EXIT_MS}ms ease-out`,
        }}
      />

      {/* Panel - anchored just LEFT of the thread overlay: same width and
          top/bottom insets, offset right by one thread-width plus two
          space-md gutters so it sits beside the thread panel. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          zIndex: Z.DRAWER,
          top: "calc(var(--canvas-top) + var(--space-md) - 2px)",
          right: "calc(var(--space-md) + var(--thread-width) + var(--space-md))",
          bottom: "var(--space-md)",
          width: "var(--thread-width)",
          animation: !open
            ? `slideOutLeft ${EXIT_MS}ms ease-in forwards`
            : `slideInLeft ${EXIT_MS}ms ease-out`,
        }}
      >
        {/* Header */}
        <div className="px-sm py-sm shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="text-body text-highlight-10 font-semibold">
              New ticket
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close ticket form"
              className="p-xs text-highlight-10 hover:bg-neutral-30 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              data-no-elevate
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-sm flex-1 overflow-y-auto">
          <TicketForm onSuccess={onClose} />
        </div>
      </div>
    </>
  );
}
