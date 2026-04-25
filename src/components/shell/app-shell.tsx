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
      {/* Persistent logo overlay — pinned to top-left of the sidebar column.
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
            top: "var(--space-xl)",
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
            paddingTop: "var(--space-md)",
            paddingBottom: "var(--space-sm)",
            gap: 0,
          }}
        >
          <TopNav />
          {/* Separator between top nav and submenu — 2px high, sits in a
              flex-stretched track of var(--space-md) so it's exactly centred
              regardless of TopNav's rendered height. Hidden on settings. */}
          {currentPage !== "settings" ? (
            <div
              aria-hidden="true"
              className="pointer-events-none flex shrink-0 items-center justify-center"
              style={{ height: "var(--space-md)" }}
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
            <div style={{ height: "var(--space-md)" }} />
          )}
          <SubmenuBar />
        </div>
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
