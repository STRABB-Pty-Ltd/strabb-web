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

const showViewSwitcher = (p: PageId) => p === "calendar" || p === "messaging" || p === "cleaning";
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
        width: "var(--sidebar-width)",
        backgroundColor: "var(--surface-sidebar)",
      }}
    >
      {/* Spacer reserves topnav row for the absolute logo overlay in app-shell */}
      <div
        className="shrink-0"
        style={{ height: "var(--topnav-height)" }}
        aria-hidden="true"
      />

      {showSettingsNav(currentPage) && <SettingsNavSection />}
      {showViewSwitcher(currentPage) && <ViewSwitcher page={currentPage} />}
      {showListingFilter(currentPage) && <ListingFilterTree />}
      {showTimeframe(currentPage) && <TimeframeSelector page={currentPage} />}
      {showChannelFilter(currentPage) && <ChannelFilter />}

      {showShoppingList(currentPage) && (
        <div style={{ padding: "var(--space-sm)" }}>
          <button
            type="button"
            onClick={openShoppingListPopup}
            className="flex w-full items-center gap-base rounded-lg px-sm py-base text-body font-medium transition-colors"
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
            className="flex w-full items-center gap-base rounded-lg px-sm py-base text-body font-medium transition-colors"
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
                    className="block w-full truncate rounded-lg px-sm py-base text-left text-body font-medium"
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
