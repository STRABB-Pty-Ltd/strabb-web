"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAppStore } from "@/stores/app-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { PageId } from "@/stores/types";

import { BillingBanner } from "@/components/billing/billing-banner";
import { BookingDetailDrawer } from "@/components/overlays/booking-detail-drawer";
import { CleaningDetailDrawer } from "@/components/overlays/cleaning-detail-drawer";
import { TicketDetailDrawer } from "@/components/overlays/ticket-detail-drawer";
import { TimeframePopup } from "@/components/overlays/timeframe-popup";
import { ToastContainer } from "@/components/overlays/toast-container";

import { Canvas } from "./canvas";
import { ContextualSidebar } from "./contextual-sidebar";
import { ErrorBoundary } from "./error-boundary";
import { KeyboardHelpModal } from "./keyboard-help-modal";
import { PageLoading } from "./page-loading";
import { LogoSection } from "./sidebar-sections/logo-section";
import { SubmenuBar } from "./submenu-bar";
import { TopNav } from "./top-nav";

const validPages: PageId[] = [
  "dashboard",
  "calendar",
  "messaging",
  "cleaning",
  "reporting",
  "settings",
];

export function NewAppShell({ children }: { children: React.ReactNode }) {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const pathname = usePathname();
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts();

  // Sync store's currentPage with URL on mount and navigation
  useEffect(() => {
    const segment = pathname.split("/")[1] as PageId;
    if (segment && validPages.includes(segment) && segment !== currentPage) {
      setCurrentPage(segment);
    }
  }, [pathname, currentPage, setCurrentPage]);

  const showSidebarSeparator = currentPage !== "settings";

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Persistent logo overlay - pinned to top-left of the sidebar column.
          pointer-events-none so the bottom of the logo (which overflows
          --logo-area-height into the listings header by design) doesn't
          intercept clicks meant for the sidebar's heading row underneath. */}
      <div className="pointer-events-none absolute top-0 left-0 z-30">
        <LogoSection />
      </div>
      <ContextualSidebar />
      {showSidebarSeparator && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20"
          style={{
            left: "calc(var(--sidebar-width) + 4px)",
            top: "var(--canvas-top)",
            bottom: "var(--space-xl)",
            width: "2px",
            backgroundColor: "var(--neutral-30)",
          }}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <BillingBanner />
        <div
          className="relative flex shrink-0 flex-col"
          style={{
            paddingTop: "var(--space-sm)",
            paddingBottom: "var(--space-sm)",
            gap: 0,
          }}
        >
          <TopNav />
          {/* Separator between top nav and submenu - 2px line in a 12px track
              so it has 5px breathing room on each side. Hidden on settings;
              that branch keeps the same 12px gap for vertical rhythm parity. */}
          {currentPage !== "settings" ? (
            <div
              aria-hidden="true"
              className="pointer-events-none flex shrink-0 items-center justify-center"
              style={{ height: 12 }}
            >
              <div
                style={{
                  width: 385,
                  height: 2,
                  marginLeft: "calc(0px - var(--sidebar-width) / 2)",
                  backgroundColor: "var(--neutral-30)",
                }}
              />
            </div>
          ) : (
            <div style={{ height: 12 }} />
          )}
          <SubmenuBar />
        </div>
        {/* Horizontal rail/canvas separator - 2px, runs full width of the
            flex column (i.e. from the sidebar's right edge across to the page
            right). Pairs with the vertical sidebar separator (which now
            starts at --canvas-top) to form an L-frame around the canvas.
            relative + zIndex so it paints above adjacent debug outlines. */}
        <div
          aria-hidden="true"
          className="relative shrink-0"
          style={{ height: 2, backgroundColor: "var(--neutral-30)", zIndex: 25 }}
        />
        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <Canvas>{children}</Canvas>
          </Suspense>
        </ErrorBoundary>
      </div>
      {helpOpen && <KeyboardHelpModal onClose={() => setHelpOpen(false)} />}
      <BookingDetailDrawer />
      <CleaningDetailDrawer />
      <TicketDetailDrawer />
      <TimeframePopup />
      <ToastContainer />
    </div>
  );
}
