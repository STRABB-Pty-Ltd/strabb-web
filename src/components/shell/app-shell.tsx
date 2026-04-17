"use client";

// NOTE: All shell components (Phases 13-24) are light-mode only.
// Dark mode support is a known gap — see docs/TODO-dark-mode.md.

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAppStore } from "@/stores/app-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { PageId } from "@/stores/types";

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
      {/* Persistent logo overlay — pinned to top-left of the sidebar column */}
      <div className="absolute top-0 left-0 z-30">
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
        <div
          className="relative flex shrink-0 flex-col"
          style={{
            paddingTop: "var(--space-md)",
            paddingBottom: "var(--space-md)",
            gap: "var(--space-md)",
          }}
        >
          <TopNav />
          <SubmenuBar />
          {/* Separator between top nav and submenu — 2px, stops 55px inside
              the outer edges of Dashboard and Reporting buttons.
              Nav group width: 5 × 95px + 4 × 5px = 495px → separator = 495 - 110 = 385px
              Hidden on settings (no submenu row, so the line would slice through TopNav). */}
          {currentPage !== "settings" && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                top: "50%",
                left: "calc(50% - var(--sidebar-width) / 4)",
                transform: "translate(-50%, -50%)",
                width: 385,
                height: 2,
                backgroundColor: "var(--neutral-30)",
              }}
            />
          )}
        </div>
        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <Canvas>{children}</Canvas>
          </Suspense>
        </ErrorBoundary>
      </div>
      {helpOpen && <KeyboardHelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
