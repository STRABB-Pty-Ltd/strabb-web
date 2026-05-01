"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useDelayedClose } from "@/hooks/use-delayed-close";

const shortcuts = [
  { keys: ["1"], description: "Go to Dashboard" },
  { keys: ["2"], description: "Go to Calendar" },
  { keys: ["3"], description: "Go to Messaging" },
  { keys: ["4"], description: "Go to Cleaning" },
  { keys: ["5"], description: "Go to Reporting" },
  { keys: ["Esc"], description: "Close current overlay" },
  { keys: ["?"], description: "Toggle this help" },
];

const EXIT_MS = 200;

export function KeyboardHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!shouldRender) return null;

  const scrimAnim = !open ? `fadeOut ${EXIT_MS}ms ease forwards` : `fadeIn ${EXIT_MS}ms ease`;
  const cardAnim = !open ? `scaleOut ${EXIT_MS}ms ease forwards` : `scaleIn ${EXIT_MS}ms ease`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{ animation: scrimAnim }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="p-md w-full max-w-sm rounded-xl bg-white shadow-xl"
        style={{ animation: cardAnim }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-md flex items-center justify-between">
          <h2 className="text-subheading font-semibold">Keyboard Shortcuts</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-xs rounded hover:bg-gray-100"
            aria-label="Close shortcuts help"
            data-no-elevate
          >
            <X size={21} />
          </button>
        </div>
        <div className="space-y-base">
          {shortcuts.map((s) => (
            <div key={s.keys.join("+")} className="text-body flex items-center justify-between">
              <span className="text-gray-600">{s.description}</span>
              <div className="gap-xs flex">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-base py-xs text-body rounded border border-gray-200 bg-gray-50 font-mono"
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
