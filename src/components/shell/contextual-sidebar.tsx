"use client";

import { BookOpen, ShoppingCart, X } from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

import { ActionsSection } from "./sidebar-sections/actions-section";
import { ChannelFilter } from "./sidebar-sections/channel-filter";
import { ListingFilterTree } from "./sidebar-sections/listing-filter-tree";
import { LogoSection } from "./sidebar-sections/logo-section";
import { TimeframeSelector } from "./sidebar-sections/timeframe-selector";
import { ViewSwitcher } from "./sidebar-sections/view-switcher";

const showLogo = (p: PageId) => p !== "settings";
const showViewSwitcher = (p: PageId) => p === "calendar" || p === "messaging" || p === "cleaning";
const showListingFilter = (p: PageId) => p !== "settings";
const showTimeframe = (p: PageId) =>
  p === "dashboard" || p === "calendar" || p === "cleaning" || p === "reporting";
const showChannelFilter = (p: PageId) => p === "messaging";
const showShoppingList = (p: PageId) => p === "cleaning";
const showSavedReports = (p: PageId) => p === "reporting";
const showActions = (p: PageId) => p !== "settings";

export function ContextualSidebar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const openShoppingListPopup = useAppStore((s) => s.openShoppingListPopup);
  const savedReportsOpen = useAppStore((s) => s.reporting.savedReportsOpen);
  const toggleSavedReports = useAppStore((s) => s.toggleSavedReports);
  const savedReports = useAppStore((s) => s.reporting.savedReports);

  return (
    <>
      {/* Mobile scrim */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        role="complementary"
        aria-label="Sidebar"
        className={[
          "flex flex-col bg-white border-r overflow-y-auto",
          "transition-transform duration-300 ease-in-out",
          // Mobile: floating overlay
          "fixed top-0 left-0 z-50 h-full lg:relative lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-translate-x-full",
        ].join(" ")}
        style={{
          width: "var(--sidebar-width)",
          borderColor: "var(--border)",
          top: 0,
        }}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {showLogo(currentPage) && <LogoSection />}
        {showViewSwitcher(currentPage) && <ViewSwitcher page={currentPage} />}
        {showListingFilter(currentPage) && <ListingFilterTree />}
        {showTimeframe(currentPage) && <TimeframeSelector page={currentPage} />}
        {showChannelFilter(currentPage) && <ChannelFilter />}

        {showShoppingList(currentPage) && (
          <div
            className="border-b"
            style={{ padding: "var(--space-md)", borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={openShoppingListPopup}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ShoppingCart size={16} />
              Shopping List
            </button>
          </div>
        )}

        {showSavedReports(currentPage) && (
          <div
            className="border-b"
            style={{ padding: "var(--space-md)", borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={toggleSavedReports}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <BookOpen size={16} />
              Saved Reports
            </button>
            {savedReportsOpen && (
              <div className="mt-2 space-y-1">
                {savedReports.length === 0 ? (
                  <p className="px-2 text-xs text-gray-400">No saved reports</p>
                ) : (
                  savedReports.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="block w-full truncate rounded px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {r.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto">
          {showActions(currentPage) && <ActionsSection />}
        </div>
      </aside>
    </>
  );
}
