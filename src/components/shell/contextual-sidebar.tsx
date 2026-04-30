"use client";

import { BookOpen, ShoppingCart } from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

import { ActionsSection } from "./sidebar-sections/actions-section";
import { ChannelFilter } from "./sidebar-sections/channel-filter";
import { ListingFilterTree } from "./sidebar-sections/listing-filter-tree";
import { SettingsNavSection } from "./sidebar-sections/settings-nav-section";
import { TimeframeSelector } from "./sidebar-sections/timeframe-selector";
import { ViewSwitcher } from "./sidebar-sections/view-switcher";

const showViewSwitcher = (p: PageId) => p === "calendar";
const showListingFilter = (p: PageId) => p !== "settings";
const showTimeframe = (p: PageId) =>
  p === "dashboard" || p === "calendar" || p === "cleaning" || p === "reporting";
const showChannelFilter = (p: PageId) => p === "messaging";
const showShoppingList = (p: PageId) => p === "cleaning";
const showSavedReports = (p: PageId) => p === "reporting";
const showActions = (p: PageId) => p !== "settings";
const showSettingsNav = (p: PageId) => p === "settings";

export function ContextualSidebar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const openShoppingListPopup = useAppStore((s) => s.openShoppingListPopup);
  const savedReportsOpen = useAppStore((s) => s.reporting.savedReportsOpen);
  const toggleSavedReports = useAppStore((s) => s.toggleSavedReports);
  const savedReports = useAppStore((s) => s.reporting.savedReports);

  return (
    <aside
      role="complementary"
      aria-label="Sidebar"
      className="no-scrollbar relative z-10 flex h-full shrink-0 flex-col overflow-y-auto"
      style={{
        // 4px wider than the content track (--sidebar-width) so the right
        // edge of the aside sits flush with the grey separator at
        // calc(var(--sidebar-width) + 4px). 6px paddingRight then pushes
        // the inner content's right edge in by 6, giving a 19px gap
        // (13 tree-padding + 6 aside-padding) between sidebar buttons and
        // the separator. Contents' left positions are unaffected.
        width: "calc(var(--sidebar-width) + 4px)",
        paddingRight: "6px",
        backgroundColor: "var(--surface-sidebar)",
      }}
    >
      {/* Spacer reserves room for the absolute logo overlay in app-shell.
          Sized so the first listing button top aligns with the canvas top
          across the divider — see --logo-area-height in globals.css. */}
      <div className="shrink-0" style={{ height: "var(--logo-area-height)" }} aria-hidden="true" />

      {showSettingsNav(currentPage) && <SettingsNavSection />}
      {showListingFilter(currentPage) && <ListingFilterTree />}
      {showTimeframe(currentPage) && <TimeframeSelector page={currentPage} />}
      {showViewSwitcher(currentPage) && <ViewSwitcher page={currentPage} />}
      {showChannelFilter(currentPage) && <ChannelFilter />}

      {showShoppingList(currentPage) && (
        <div style={{ padding: "var(--space-sm)" }}>
          <button
            type="button"
            onClick={openShoppingListPopup}
            className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: "var(--btn-inactive-bg)",
              color: "var(--btn-inactive-text)",
            }}
          >
            <ShoppingCart size={13} />
            Shopping List
          </button>
        </div>
      )}

      {showSavedReports(currentPage) && (
        <div style={{ padding: "var(--space-sm)" }}>
          <button
            type="button"
            onClick={toggleSavedReports}
            className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: "var(--btn-inactive-bg)",
              color: "var(--btn-inactive-text)",
            }}
          >
            <BookOpen size={13} />
            Saved Reports
          </button>
          {savedReportsOpen && (
            <div className="mt-base space-y-xs">
              {savedReports.length === 0 ? (
                <p className="px-base text-body" style={{ color: "var(--brand-10)", opacity: 0.6 }}>
                  No saved reports
                </p>
              ) : (
                savedReports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="px-sm py-base text-body block w-full truncate rounded-lg text-left font-medium"
                    style={{
                      backgroundColor: "var(--btn-inactive-bg)",
                      color: "var(--btn-inactive-text)",
                    }}
                  >
                    {r.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {showActions(currentPage) && <ActionsSection />}
    </aside>
  );
}
