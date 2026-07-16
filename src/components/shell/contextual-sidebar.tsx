"use client";

import { BookOpen, ChevronDown, ChevronRight, Plus, ShoppingCart } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { useSavedReports } from "@/hooks/use-reporting";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

import { ActionsSection } from "./sidebar-sections/actions-section";
import { CalendarActionsSection } from "./sidebar-sections/calendar-actions-section";
import { ChannelFilter } from "./sidebar-sections/channel-filter";
import { ListingFilterTree } from "./sidebar-sections/listing-filter-tree";
import { SettingsNavSection } from "./sidebar-sections/settings-nav-section";
import { TimeframeSelector } from "./sidebar-sections/timeframe-selector";
import { ViewSwitcher } from "./sidebar-sections/view-switcher";

const showViewSwitcher = (p: PageId) => p === "calendar";
const showCalendarActions = (p: PageId) => p === "calendar";
const showListingFilter = (p: PageId) => p !== "settings";
export const showTimeframe = (p: PageId) =>
  p === "dashboard" || p === "calendar" || p === "operations" || p === "reporting";
const showChannelFilter = (p: PageId) => p === "messaging";
const showShoppingList = (p: PageId) => p === "operations";
const showSavedReports = (p: PageId) => p === "reporting";
const showActions = (p: PageId) => p !== "settings";
const showSettingsNav = (p: PageId) => p === "settings";

/** ListingFilterTree, collapsed by default. Same hand-rolled
 *  useState + ChevronDown/ChevronRight + aria-expanded convention as this
 *  file's own custom-group toggle and listing-row.tsx's accordion - no
 *  shared collapsible primitive exists in this codebase, and none is
 *  introduced here either. Only used by MobileNavDrawer (M.3): the tree
 *  is the tallest section and the one most likely to push everything else
 *  below the fold there. Desktop keeps it always-expanded via the plain
 *  <ListingFilterTree /> branch below. */
function CollapsibleListingFilter() {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  return (
    <>
      {/* Own p-sm block, sibling to (not wrapping) the body - the body is
          <ListingFilterTree /> unmodified, which already brings its own
          p-sm padding, so nesting them would double it up. */}
      <div className="p-sm">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="gap-base px-sm py-base text-body bg-neutral-30 text-highlight-10 flex w-full items-center rounded-lg font-medium"
        >
          {expanded ? (
            <ChevronDown size={13} aria-hidden="true" />
          ) : (
            <ChevronRight size={13} aria-hidden="true" />
          )}
          Listings
        </button>
      </div>
      {expanded && (
        <div id={bodyId}>
          <ListingFilterTree />
        </div>
      )}
    </>
  );
}

interface ContextualSidebarSectionsProps {
  /** Wraps ListingFilterTree in a collapsed-by-default disclosure instead
   *  of rendering it directly. Only MobileNavDrawer opts in - desktop
   *  keeps the tree always-expanded, unchanged. */
  collapsibleListingFilter?: boolean;
  /** Rendered immediately after TimeframeSelector, only on pages where it
   *  actually renders. MobileNavDrawer uses this to slot its timeframe
   *  stepper directly under the Day/Week/Fortnight/etc. picker instead of
   *  up near the view chips - the stepper only makes sense once a window
   *  size is chosen, so it reads better grouped with that control than
   *  separated from it. Desktop doesn't pass this; its own stepper lives
   *  in SubmenuBar's left slot, not in this shared section list. */
  renderAfterTimeframe?: ReactNode;
}

/** The desktop sidebar's per-page section composition, extracted (M.3) so
 *  MobileNavDrawer renders the exact same gating instead of a second,
 *  hand-maintained per-page list that can drift from this one. */
export function ContextualSidebarSections({
  collapsibleListingFilter = false,
  renderAfterTimeframe,
}: ContextualSidebarSectionsProps) {
  const currentPage = useAppStore((s) => s.currentPage);
  const openShoppingListPopup = useAppStore((s) => s.openShoppingListPopup);
  const savedReportsOpen = useAppStore((s) => s.reporting.savedReportsOpen);
  const toggleSavedReports = useAppStore((s) => s.toggleSavedReports);
  const { savedReports, saveCurrentReport, loadReport, activeSavedReport, resetToDefaultView } =
    useSavedReports();
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newReportName, setNewReportName] = useState("");

  const handleSaveCurrent = () => {
    if (!newReportName.trim()) return;
    saveCurrentReport(newReportName.trim());
    setNewReportName("");
    setShowSaveInput(false);
  };

  return (
    <>
      {showSettingsNav(currentPage) && <SettingsNavSection />}
      {showListingFilter(currentPage) &&
        (collapsibleListingFilter ? <CollapsibleListingFilter /> : <ListingFilterTree />)}
      {showTimeframe(currentPage) && (
        <>
          <TimeframeSelector page={currentPage} />
          {renderAfterTimeframe}
        </>
      )}
      {showViewSwitcher(currentPage) && <ViewSwitcher page={currentPage} />}
      {showCalendarActions(currentPage) && <CalendarActionsSection />}
      {showChannelFilter(currentPage) && <ChannelFilter />}

      {showShoppingList(currentPage) && (
        <div className="p-sm">
          <button
            type="button"
            onClick={openShoppingListPopup}
            aria-haspopup="dialog"
            className="gap-base px-sm py-base text-body bg-neutral-30 text-highlight-10 flex w-full items-center rounded-lg font-medium transition-colors"
          >
            <ShoppingCart size={13} aria-hidden="true" />
            Shopping List
          </button>
        </div>
      )}

      {showSavedReports(currentPage) && (
        <div className="p-sm">
          <button
            type="button"
            onClick={toggleSavedReports}
            aria-expanded={savedReportsOpen}
            className="gap-base px-sm py-base text-body bg-neutral-30 text-highlight-10 flex w-full items-center rounded-lg font-medium transition-colors"
          >
            <BookOpen size={13} aria-hidden="true" />
            Saved Reports
          </button>
          {savedReportsOpen && (
            <div className="mt-base space-y-xs">
              {showSaveInput ? (
                <div className="gap-xs flex flex-col">
                  <label htmlFor="sidebar-save-report-name" className="sr-only">
                    Report name
                  </label>
                  <input
                    id="sidebar-save-report-name"
                    type="text"
                    value={newReportName}
                    onChange={(e) => setNewReportName(e.target.value)}
                    placeholder="Report name..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveCurrent();
                      if (e.key === "Escape") {
                        setShowSaveInput(false);
                        setNewReportName("");
                      }
                    }}
                    className="px-base py-xs text-body bg-surface-60 border-border w-full rounded-sm border"
                  />
                  <div className="gap-xs flex">
                    <button
                      type="button"
                      onClick={handleSaveCurrent}
                      disabled={!newReportName.trim()}
                      className="px-sm py-xs text-body bg-highlight-10 text-surface-60 flex-1 rounded-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveInput(false);
                        setNewReportName("");
                      }}
                      className="px-sm py-xs text-body text-highlight-10 hover:bg-neutral-30 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSaveInput(true)}
                  className="gap-xs px-sm py-base text-body text-highlight-10 flex w-full items-center rounded-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                >
                  <Plus size={13} aria-hidden="true" />
                  Save current
                </button>
              )}
              <button
                type="button"
                onClick={resetToDefaultView}
                disabled={activeSavedReport === null}
                className="px-sm py-base text-body bg-neutral-30 text-highlight-10 w-full rounded-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Show default
              </button>
              {savedReports.length === 0 ? (
                <p className="px-base text-body text-[var(--text-secondary)]">No saved reports</p>
              ) : (
                savedReports.map((r) => {
                  const isActive = r.id === activeSavedReport;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => loadReport(r.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "px-sm py-base text-body block w-full truncate rounded-lg text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
                        isActive
                          ? "bg-highlight-10 text-surface-60"
                          : "bg-neutral-30 text-highlight-10",
                      )}
                    >
                      {r.name}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {showActions(currentPage) && <ActionsSection />}
    </>
  );
}

export function ContextualSidebar() {
  return (
    <aside
      role="complementary"
      aria-label="Sidebar"
      // Hidden below lg (1024px, M.1): no mobile home yet for filters/actions
      // - that's the hamburger-drawer phase (M.3), not this one. Not md
      // (768px) - the desktop shell isn't safe below lg, see
      // mobile-bottom-nav.tsx's comment.
      className="no-scrollbar bg-surface-60 relative z-10 hidden h-full shrink-0 flex-col overflow-y-auto lg:flex"
      style={{
        // 4px wider than the content track (--sidebar-width) so the right
        // edge of the aside sits flush with the grey separator at
        // calc(var(--sidebar-width) + 4px). 6px paddingRight then pushes
        // the inner content's right edge in by 6, giving a 19px gap
        // (13 tree-padding + 6 aside-padding) between sidebar buttons and
        // the separator. Contents' left positions are unaffected.
        width: "calc(var(--sidebar-width) + 4px)",
        paddingRight: "6px",
      }}
    >
      {/* Spacer reserves room for the absolute logo overlay in app-shell.
          Sized so the first listing button top aligns with the canvas top
          across the divider - see --logo-area-height in globals.css. */}
      <div className="shrink-0" style={{ height: "var(--logo-area-height)" }} aria-hidden="true" />
      <ContextualSidebarSections />
    </aside>
  );
}
