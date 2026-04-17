"use client";

// NOTE: All shell components (Phases 13-24) are light-mode only.
// Dark mode support is a known gap — see docs/TODO-dark-mode.md.

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { PageId } from "@/stores/types";

import { Canvas } from "./canvas";
import { ContextualSidebar } from "./contextual-sidebar";
import { ErrorBoundary } from "./error-boundary";
import { KeyboardHelpModal } from "./keyboard-help-modal";
import { PageLoading } from "./page-loading";
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
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
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

  return (
    <div className="relative flex h-screen overflow-hidden">
      <ContextualSidebar />
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? 0 : `calc(-1 * var(--sidebar-width))`,
        }}
      >
        <TopNav />
        <SubmenuBar />
        {/* Desktop sidebar toggle */}
        <div className="hidden shrink-0 border-b px-2 py-1 lg:block">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
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
