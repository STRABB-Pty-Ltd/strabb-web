"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";

import { useCreateShare } from "@/lib/api-hooks/share-api";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { buildShareFilters, type ShareableMenu } from "@/lib/share-filters";
import { Z } from "@/lib/z-index";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

const isShareableMenu = (page: PageId): page is ShareableMenu => page !== "settings";

const defaultFields = [
  { key: "revenue", label: "Revenue" },
  { key: "bookings", label: "Bookings" },
  { key: "occupancy", label: "Occupancy" },
  { key: "cleaning", label: "Cleaning Tasks" },
  { key: "expenses", label: "Expenses" },
];

type ExpiryOption = "never" | "1d" | "7d" | "30d";

const expiryOptions: { value: ExpiryOption; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

const expiryToIso = (option: ExpiryOption): string | null => {
  if (option === "never") return null;
  const days = option === "1d" ? 1 : option === "7d" ? 7 : 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

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
  const createShare = useCreateShare();
  const [downloading, setDownloading] = useState(false);
  const [expiry, setExpiry] = useState<ExpiryOption>("never");

  const open = sharePopup.open;
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const timeframeFor = useCallback(
    (page: PageId): { windowSize: string; anchor: string | null } => {
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
    },
    [dashboard, calendar, cleaning, reporting],
  );

  const ensureShare = useCallback(async () => {
    if (!isShareableMenu(currentPage)) return null;
    const { windowSize, anchor } = timeframeFor(currentPage);
    const filters = buildShareFilters(currentPage, {
      windowSize,
      anchor,
      customRange,
      selectedListings,
    });
    return createShare.mutateAsync({
      menu: currentPage,
      filters,
      expiresAt: expiryToIso(expiry),
    });
  }, [createShare, currentPage, customRange, expiry, selectedListings, timeframeFor]);

  const handleDownload = async () => {
    if (!isShareableMenu(currentPage)) return;
    setDownloading(true);
    try {
      const share = await ensureShare();
      if (!share) return;
      const pdfResp = await fetch(`/be/share/${share.token}`);
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

  const handleCopyLink = async () => {
    try {
      const share = await ensureShare();
      if (!share) return;
      await navigator.clipboard.writeText(share.publicUrl);
      addToast({ type: "success", message: "Public link copied to clipboard" });
      closeSharePopup();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create share link";
      addToast({ type: "error", message });
    }
  };

  const handleOpenInTab = async () => {
    try {
      const share = await ensureShare();
      if (!share) return;
      window.open(share.publicUrl, "_blank", "noopener,noreferrer");
      closeSharePopup();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create share link";
      addToast({ type: "error", message });
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

  const busy = downloading || createShare.isPending;
  const disabled = busy || !isShareableMenu(currentPage);

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
          className="bg-surface-60 w-full max-w-md rounded-xl shadow-xl"
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
              className="p-xs text-highlight-10 hover:bg-neutral-30 rounded"
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
                  className="h-sm border-neutral-30 w-sm rounded"
                />
                <span className="text-body text-highlight-10">{f.label}</span>
              </label>
            ))}

            <div className="gap-base pt-base flex items-center">
              <label htmlFor="share-expiry" className="text-body text-highlight-10">
                Link expires:
              </label>
              <select
                id="share-expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value as ExpiryOption)}
                className="px-sm py-xs text-body border-neutral-30 rounded-lg border"
                style={{ backgroundColor: "var(--surface-60)", color: "var(--highlight-10)" }}
              >
                {expiryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="gap-base px-sm py-sm flex flex-wrap justify-end border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={closeSharePopup}
              className="px-sm py-base text-body text-highlight-10 hover:bg-neutral-30 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpenInTab}
              disabled={disabled}
              className="gap-xs px-sm py-base text-body border-neutral-30 text-highlight-10 hover:bg-neutral-30 inline-flex items-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink size={14} />
              Open
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={disabled}
              className="px-sm py-base text-body border-neutral-30 text-highlight-10 hover:bg-neutral-30 rounded-lg border disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Generating…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={disabled}
              className="px-sm py-base text-body rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
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
