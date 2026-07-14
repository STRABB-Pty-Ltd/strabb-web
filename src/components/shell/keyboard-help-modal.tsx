"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";

const shortcuts = [
  { keys: ["1"], description: "Go to Dashboard" },
  { keys: ["2"], description: "Go to Calendar" },
  { keys: ["3"], description: "Go to Messaging" },
  { keys: ["4"], description: "Go to Cleaning" },
  { keys: ["5"], description: "Go to Reporting" },
  { keys: ["Esc"], description: "Close current overlay" },
  { keys: ["Shift", "?"], description: "Toggle this help" },
];

const EXIT_MS = 200;

export function KeyboardHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useClickOutside(panelRef, onClose, open);

  if (!shouldRender) return null;

  const scrimAnim = !open
    ? `fadeOut ${EXIT_MS}ms ease-in forwards`
    : `fadeIn ${EXIT_MS}ms ease-out`;
  const cardAnim = !open
    ? `scaleOut ${EXIT_MS}ms ease-in forwards`
    : `scaleIn ${EXIT_MS}ms ease-out`;

  return (
    <div
      className="bg-scrim fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: scrimAnim }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        ref={panelRef}
        className="p-md bg-surface-60 w-full max-w-sm rounded-xl shadow-xl"
        style={{ animation: cardAnim }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-md flex items-center justify-between">
          <h2 className="text-subheading font-semibold">Keyboard Shortcuts</h2>
          {/* Button ghost hover:bg-muted resolves to the same --neutral-30 this
              button hand-rolled; icon-touch is the same 44px hit area the
              min-h/min-w pair produced. "rounded" preserves the pre-existing
              corner radius over the primitive's rounded-lg, and size-md on the
              icon (21px, matching size={21}) opts it out of the primitive's
              13px svg default. */}
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon-touch"
            onClick={onClose}
            className="rounded"
            aria-label="Close shortcuts help"
            data-no-elevate
          >
            <X size={21} className="size-md" />
          </Button>
        </div>
        <div className="space-y-base">
          {shortcuts.map((s) => (
            <div key={s.keys.join("+")} className="text-body flex items-center justify-between">
              <span className="text-highlight-10">{s.description}</span>
              <div className="gap-xs flex">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-base py-xs text-body border-neutral-30 bg-neutral-30 rounded border font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
