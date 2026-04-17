"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const shortcuts = [
  { keys: ["1"], description: "Go to Dashboard" },
  { keys: ["2"], description: "Go to Calendar" },
  { keys: ["3"], description: "Go to Messaging" },
  { keys: ["4"], description: "Go to Cleaning" },
  { keys: ["5"], description: "Go to Reporting" },
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
        className="w-full max-w-sm rounded-xl bg-white p-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-md flex items-center justify-between">
          <h2 className="text-subheading font-semibold">Keyboard Shortcuts</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded p-xs hover:bg-gray-100"
            aria-label="Close shortcuts help"
          >
            <X size={21} />
          </button>
        </div>
        <div className="space-y-base">
          {shortcuts.map((s) => (
            <div key={s.keys.join("+")} className="flex items-center justify-between text-body">
              <span className="text-gray-600">{s.description}</span>
              <div className="flex gap-xs">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-gray-200 bg-gray-50 px-base py-xs font-mono text-body"
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
