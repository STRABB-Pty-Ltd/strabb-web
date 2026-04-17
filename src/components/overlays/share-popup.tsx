"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

const defaultFields = [
  { key: "revenue", label: "Revenue" },
  { key: "bookings", label: "Bookings" },
  { key: "occupancy", label: "Occupancy" },
  { key: "cleaning", label: "Cleaning Tasks" },
  { key: "expenses", label: "Expenses" },
];

export function SharePopup() {
  const sharePopup = useAppStore((s) => s.sharePopup);
  const closeSharePopup = useAppStore((s) => s.closeSharePopup);
  const shareFields = useAppStore((s) => s.shareFields);
  const setShareFields = useAppStore((s) => s.setShareFields);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSharePopup();
    },
    [closeSharePopup],
  );

  useEffect(() => {
    if (sharePopup.open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [sharePopup.open, handleKeyDown]);

  if (!sharePopup.open) return null;

  const toggleField = (key: string) => {
    setShareFields({ ...shareFields, [key]: !shareFields[key] });
  };

  return (
    <>
      <div className="fixed inset-0 z-[180] bg-black/30" onClick={closeSharePopup} />
      <div className="fixed inset-0 z-[185] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
          <div
            className="flex items-center justify-between border-b px-sm py-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-body font-semibold">Share Report</h2>
            <button
              type="button"
              onClick={closeSharePopup}
              className="rounded p-xs text-gray-400 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-sm p-sm">
            <p className="text-body text-gray-500">Select fields to include:</p>
            {defaultFields.map((f) => (
              <label key={f.key} className="flex items-center gap-base">
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
            className="flex justify-end gap-base border-t px-sm py-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={closeSharePopup}
              className="rounded-lg px-sm py-base text-body text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              className="relative rounded-lg border border-dashed border-gray-300 px-sm py-base text-body text-gray-400"
              title="PDF export coming soon"
            >
              Download PDF
              <span className="absolute -top-base -right-base rounded-full bg-gray-100 px-xs py-xs text-body font-medium text-gray-500">
                Soon
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                closeSharePopup();
              }}
              className="rounded-lg px-sm py-base text-body text-white"
              style={{ backgroundColor: "var(--strabb-secondary)" }}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
