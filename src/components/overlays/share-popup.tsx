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
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-sm font-semibold">Share Report</h2>
            <button
              type="button"
              onClick={closeSharePopup}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-sm text-gray-500">Select fields to include:</p>
            {defaultFields.map((f) => (
              <label key={f.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shareFields[f.key] ?? true}
                  onChange={() => toggleField(f.key)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{f.label}</span>
              </label>
            ))}
          </div>

          <div
            className="flex justify-end gap-2 border-t px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={closeSharePopup}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg px-4 py-2 text-sm text-gray-400"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                closeSharePopup();
              }}
              className="rounded-lg px-4 py-2 text-sm text-white"
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
