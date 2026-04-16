"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const shortcuts = [
  { keys: ["1"], description: "Go to Dashboard" },
  { keys: ["2"], description: "Go to Calendar" },
  { keys: ["3"], description: "Go to Messaging" },
  { keys: ["4"], description: "Go to Cleaning" },
  { keys: ["5"], description: "Go to Reporting" },
  { keys: ["["], description: "Collapse sidebar" },
  { keys: ["]"], description: "Expand sidebar" },
  { keys: ["Esc"], description: "Close current overlay" },
  { keys: ["?"], description: "Toggle this help" },
];

export function KeyboardHelpModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="Close shortcuts help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.keys.join("+")} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-xs"
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
