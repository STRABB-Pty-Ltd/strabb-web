"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAppStore } from "@/stores/app-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { pageLabels } from "@/lib/navigation";
import type { PageId } from "@/stores/types";

import { BillingBanner } from "@/components/billing/billing-banner";
import { AvailabilityBlockDrawer } from "@/components/overlays/availability-block-drawer";
import { BookingDetailDrawer } from "@/components/overlays/booking-detail-drawer";
import { BookingFormOverlay } from "@/components/overlays/booking-form-overlay";
import { CleaningDetailDrawer } from "@/components/overlays/cleaning-detail-drawer";
import { SharePopup } from "@/components/overlays/share-popup";
import { ShoppingListPopup } from "@/components/overlays/shopping-list-popup";
import { TicketDetailDrawer } from "@/components/overlays/ticket-detail-drawer";
import { TimeframePopup } from "@/components/overlays/timeframe-popup";
import { ToastContainer } from "@/components/overlays/toast-container";

import { Canvas } from "./canvas";
import { ContextualSidebar } from "./contextual-sidebar";
import { ErrorBoundary } from "./error-boundary";
import { KeyboardHelpModal } from "./keyboard-help-modal";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { MobileTopBar } from "./mobile-top-bar";
import { PageLoading } from "./page-loading";
import { LogoSection } from "./sidebar-sections/logo-section";
import { SubmenuBar } from "./submenu-bar";
import { TopNav } from "./top-nav";

const validPages: PageId[] = [
  "dashboard",
  "calendar",
  "messaging",
  "operations",
  "reporting",
  "settings",
];

export function NewAppShell({ children }: { children: React.ReactNode }) {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const resetPageDefaults = useAppStore((s) => s.resetPageDefaults);
  const pathname = usePathname();
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts();

  // Load persisted filter/timeframe selections on the client only. The store
  // uses skipHydration so SSR + the first client paint both render from
  // defaults (no hydration mismatch); this pulls the user's saved listing
  // filter + reporting period back in right after mount, so a reload or a
  // Cloudflare-Access re-auth no longer resets the report to current-month /
  // all-listings.
  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  // Sync store's currentPage with URL on mount and navigation. Every
  // top-level page change also resets that page's chip + view to defaults
  // so each entry feels fresh (no leaked filter from the last visit).
  useEffect(() => {
    const segment = pathname.split("/")[1] as PageId;
    if (segment && validPages.includes(segment) && segment !== currentPage) {
      setCurrentPage(segment);
      if (segment !== "settings") resetPageDefaults(segment);
    }
  }, [pathname, currentPage, setCurrentPage, resetPageDefaults]);

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Skip-link for keyboard users. Visually hidden until focused, then
          jumps the user past the persistent rails (sidebar + top nav +
          submenu) straight to the main canvas content. */}
      <a
        href="#main-content"
        className="focus:px-sm focus:py-base focus:text-body focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[1000] focus:rounded-lg"
      >
        Skip to main content
      </a>
      {/* Persistent logo overlay - pinned to top-left of the sidebar column.
          pointer-events-none so the bottom of the logo (which overflows
          --logo-area-height into the listings header by design) doesn't
          intercept clicks meant for the sidebar's heading row underneath.
          Hidden below lg (1024px) - MobileTopBar owns the wordmark there
          (M.1); lg not md, see mobile-bottom-nav.tsx's comment. */}
      <div className="pointer-events-none absolute top-0 left-0 z-30 hidden lg:block">
        <LogoSection />
      </div>
      <ContextualSidebar />
      {/* Vertical sidebar separator - hidden below lg alongside the sidebar
          it borders (M.1: no sidebar on mobile until M.3's drawer). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-20 hidden lg:block"
        style={{
          left: "calc(var(--sidebar-width) + 4px)",
          top: "var(--canvas-top)",
          bottom: "var(--space-xl)",
          width: "var(--hairline)",
          backgroundColor: "var(--neutral-30)",
        }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BillingBanner />
        <MobileTopBar />
        {/* Desktop top nav + submenu rail - hidden below lg (1024px), where
            MobileTopBar + MobileBottomNav (fixed, rendered after Canvas
            below) own navigation instead (M.1). Confirmed empirically: the
            pill group's absolute positioning collides with the flow-
            positioned Settings/Sign-out cluster below ~1024px. */}
        <div
          className="relative hidden shrink-0 flex-col lg:flex"
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
              style={{ height: 12 }} // 12px track = --space-sm minus the 2px hairline that paints inside
            >
              <div
                style={{
                  width: 385, // design-locked magic value; not on the Fibonacci ladder
                  height: "var(--hairline)",
                  marginLeft: "calc(0px - var(--sidebar-width) / 2)",
                  backgroundColor: "var(--neutral-30)",
                }}
              />
            </div>
          ) : (
            <div style={{ height: 12 }} /> // 12px track = --space-sm minus the 2px hairline that paints inside
          )}
          <SubmenuBar />
        </div>
        {/* Horizontal rail/canvas separator - 2px, runs full width of the
            flex column (i.e. from the sidebar's right edge across to the page
            right). Pairs with the vertical sidebar separator (which now
            starts at --canvas-top) to form an L-frame around the canvas.
            relative + zIndex so it paints above adjacent debug outlines.
            Hidden below lg alongside the desktop rail above. */}
        <div
          aria-hidden="true"
          className="relative hidden shrink-0 lg:block"
          style={{ height: "var(--hairline)", backgroundColor: "var(--neutral-30)", zIndex: 25 }}
        />
        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <h1 className="sr-only">{pageLabels[currentPage]}</h1>
            <main id="main-content" className="contents">
              <Canvas>{children}</Canvas>
            </main>
          </Suspense>
        </ErrorBoundary>
      </div>
      <MobileBottomNav />
      <KeyboardHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <BookingDetailDrawer />
      <BookingFormOverlay />
      <AvailabilityBlockDrawer />
      <CleaningDetailDrawer />
      <TicketDetailDrawer />
      <TimeframePopup />
      <SharePopup />
      <ShoppingListPopup />
      <MobileNavDrawer />
      <ToastContainer />
    </div>
  );
}
