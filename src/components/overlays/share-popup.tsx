"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";

import { useDelayedClose } from "@/hooks/use-delayed-close";
import { Z } from "@/lib/z-index";
import { useAppStore } from "@/stores/app-store";

const defaultFields = [
  { key: "revenue", label: "Revenue" },
  { key: "bookings", label: "Bookings" },
  { key: "occupancy", label: "Occupancy" },
  { key: "cleaning", label: "Cleaning Tasks" },
  { key: "expenses", label: "Expenses" },
];

const EXIT_MS = 200;

export function SharePopup() {
  const sharePopup = useAppStore((s) => s.sharePopup);
  const closeSharePopup = useAppStore((s) => s.closeSharePopup);
  const shareFields = useAppStore((s) => s.shareFields);
  const setShareFields = useAppStore((s) => s.setShareFields);
  const open = sharePopup.open;
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSharePopup();
    },
    [closeSharePopup],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!shouldRender) return null;

  const toggleField = (key: string) => {
    setShareFields({ ...shareFields, [key]: !shareFields[key] });
  };

  const scrimAnim = !open
    ? `fadeOut ${EXIT_MS}ms ease-in forwards`
    : `fadeIn ${EXIT_MS}ms ease-out`;
  const cardAnim = !open
    ? `scaleOut ${EXIT_MS}ms ease-in forwards`
    : `scaleIn ${EXIT_MS}ms ease-out`;

  return (
    <>
      <div
        className="canvas-overlay fixed"
        style={{ zIndex: Z.MODAL_SCRIM, backgroundColor: "var(--scrim)", animation: scrimAnim }}
        onClick={closeSharePopup}
      />
      <div
        className="canvas-overlay fixed flex items-center justify-center"
        style={{ zIndex: Z.MODAL }}
      >
        <div
          className="w-full max-w-md rounded-xl bg-white shadow-xl"
          style={{ animation: cardAnim }}
        >
          <div
            className="px-sm py-sm flex items-center justify-between border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-body font-semibold">Share Report</h2>
            <button
              type="button"
              onClick={closeSharePopup}
              aria-label="Close share dialog"
              className="p-xs rounded text-gray-400 hover:bg-gray-100"
              data-no-elevate
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-sm p-sm">
            <p className="text-body text-gray-500">Select fields to include:</p>
            {defaultFields.map((f) => (
              <label key={f.key} className="gap-base flex items-center">
                <input
                  type="checkbox"
                  checked={shareFields[f.key] ?? true}
                  onChange={() => toggleField(f.key)}
                  className="h-sm w-sm rounded border-gray-300"
                />
                <span className="text-body text-gray-700">{f.label}</span>
              </label>
            ))}
          </div>

          <div
            className="gap-base px-sm py-sm flex justify-end border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={closeSharePopup}
              className="px-sm py-base text-body rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              className="px-sm py-base text-body relative rounded-lg border border-dashed border-gray-300 text-gray-400"
              title="PDF export coming soon"
            >
              Download PDF
              <span className="-top-base -right-base px-xs py-xs text-body absolute rounded-full bg-gray-100 font-medium text-gray-500">
                Soon
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                closeSharePopup();
              }}
              className="px-sm py-base text-body rounded-lg text-white"
              style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
