"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useApiClient } from "@/hooks/use-api-client";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { timeframeToDateRange } from "@/lib/timeframe-utils";
import { Z } from "@/lib/z-index";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

type ShareableMenu = "dashboard" | "calendar" | "messaging" | "cleaning" | "reporting";

interface ShareCreateResponse {
  data: {
    id: string;
    token: string;
    publicUrl: string;
    menu: string;
    expiresAt: string | null;
  };
}

const isShareableMenu = (page: PageId): page is ShareableMenu => page !== "settings";

const defaultFields = [
  { key: "revenue", label: "Revenue" },
  { key: "bookings", label: "Bookings" },
  { key: "occupancy", label: "Occupancy" },
  { key: "cleaning", label: "Cleaning Tasks" },
  { key: "expenses", label: "Expenses" },
];

const EXIT_MS = 200;

export function SharePopup() {
  const popupRef = useRef<HTMLDivElement>(null);
  const sharePopup = useAppStore((s) => s.sharePopup);
  const closeSharePopup = useAppStore((s) => s.closeSharePopup);
  const shareFields = useAppStore((s) => s.shareFields);
  const setShareFields = useAppStore((s) => s.setShareFields);
  const currentPage = useAppStore((s) => s.currentPage);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const customRange = useAppStore((s) => s.customRange);
  const dashboard = useAppStore((s) => s.dashboard);
  const calendar = useAppStore((s) => s.calendar);
  const cleaning = useAppStore((s) => s.cleaning);
  const reporting = useAppStore((s) => s.reporting);
  const addToast = useAppStore((s) => s.addToast);
  const apiClient = useApiClient();
  const [downloading, setDownloading] = useState(false);

  const open = sharePopup.open;
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  // Pull windowSize/anchor for whichever page the share was launched from.
  // Messaging has no timeframe, so it falls back to "month / current".
  const timeframeFor = (page: PageId): { windowSize: string; anchor: string | null } => {
    switch (page) {
      case "dashboard":
        return { windowSize: dashboard.windowSize, anchor: dashboard.anchor };
      case "calendar":
        return { windowSize: calendar.windowSize, anchor: calendar.anchor };
      case "cleaning":
        return { windowSize: cleaning.windowSize, anchor: cleaning.anchor };
      case "reporting":
        return { windowSize: reporting.windowSize, anchor: reporting.anchor };
      default:
        return { windowSize: "month", anchor: null };
    }
  };

  const handleDownload = async () => {
    if (!isShareableMenu(currentPage)) return;
    setDownloading(true);
    try {
      const { windowSize, anchor } = timeframeFor(currentPage);
      const { startDate, endDate } = timeframeToDateRange(windowSize, anchor, customRange);

      const create = await apiClient.post<ShareCreateResponse>("/share/create", {
        menu: currentPage,
        filters: {
          start_date: startDate,
          end_date: endDate,
          listing_ids: selectedListings,
        },
      });

      // Public endpoint, no auth header. Same /be origin so cookies don't matter.
      const pdfResp = await fetch(`/be/share/${create.data.token}`);
      if (!pdfResp.ok) throw new Error(`PDF render failed: ${pdfResp.status}`);
      const blob = await pdfResp.blob();
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strabb-${currentPage}-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      closeSharePopup();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      addToast({ type: "error", message });
    } finally {
      setDownloading(false);
    }
  };

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

  useClickOutside(popupRef, closeSharePopup, open);

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
        style={{
          ...canvasOverlayStyle,
          zIndex: Z.MODAL,
          backgroundColor: "var(--scrim)",
          animation: scrimAnim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={closeSharePopup}
      >
        <div
          ref={popupRef}
          className="w-full max-w-md rounded-xl bg-surface-60 shadow-xl"
          style={{ animation: cardAnim }}
          onClick={(e) => e.stopPropagation()}
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
              className="p-xs rounded text-highlight-10 hover:bg-neutral-30"
              data-no-elevate
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-sm p-sm">
            <p className="text-body text-highlight-10">Select fields to include:</p>
            {defaultFields.map((f) => (
              <label key={f.key} className="gap-base flex items-center">
                <input
                  type="checkbox"
                  checked={shareFields[f.key] ?? true}
                  onChange={() => toggleField(f.key)}
                  className="h-sm w-sm rounded border-neutral-30"
                />
                <span className="text-body text-highlight-10">{f.label}</span>
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
              className="px-sm py-base text-body rounded-lg text-highlight-10 hover:bg-neutral-30"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !isShareableMenu(currentPage)}
              className="px-sm py-base text-body rounded-lg border border-neutral-30 text-highlight-10 hover:bg-neutral-30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Generating…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                closeSharePopup();
              }}
              className="px-sm py-base text-body rounded-lg text-surface-60"
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
