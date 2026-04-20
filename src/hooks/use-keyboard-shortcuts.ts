"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

const pageShortcuts: Record<string, { page: PageId; href: string }> = {
  "1": { page: "dashboard", href: "/dashboard" },
  "2": { page: "calendar", href: "/calendar" },
  "3": { page: "messaging", href: "/messaging" },
  "4": { page: "cleaning", href: "/cleaning" },
  "5": { page: "reporting", href: "/reporting" },
};

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const closeDrillDownPanel = useAppStore((s) => s.closeDrillDownPanel);
  const closeThreadOverlay = useAppStore((s) => s.closeThreadOverlay);
  const closeSharePopup = useAppStore((s) => s.closeSharePopup);
  const closeShoppingListPopup = useAppStore((s) => s.closeShoppingListPopup);
  const closeTimeframePopup = useAppStore((s) => s.closeTimeframePopup);

  const drillDownPanel = useAppStore((s) => s.drillDownPanel);
  const threadOverlay = useAppStore((s) => s.threadOverlay);
  const sharePopup = useAppStore((s) => s.sharePopup);
  const shoppingListPopup = useAppStore((s) => s.shoppingListPopup);
  const tfPopup = useAppStore((s) => s.tfPopup);

  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return;

      // Escape — close topmost overlay
      if (e.key === "Escape") {
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (drillDownPanel?.open) {
          closeDrillDownPanel();
          return;
        }
        if (threadOverlay?.open) {
          closeThreadOverlay();
          return;
        }
        if (sharePopup.open) {
          closeSharePopup();
          return;
        }
        if (shoppingListPopup.open) {
          closeShoppingListPopup();
          return;
        }
        if (tfPopup.open) {
          closeTimeframePopup();
          return;
        }
        return;
      }

      // ? — help modal
      if (e.key === "?") {
        setHelpOpen((prev) => !prev);
        return;
      }

      // 1-5 — page shortcuts
      const shortcut = pageShortcuts[e.key];
      if (shortcut) {
        setCurrentPage(shortcut.page);
        router.push(shortcut.href);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    router,
    setCurrentPage,
    helpOpen,
    drillDownPanel,
    threadOverlay,
    sharePopup,
    shoppingListPopup,
    tfPopup,
    closeDrillDownPanel,
    closeThreadOverlay,
    closeSharePopup,
    closeShoppingListPopup,
    closeTimeframePopup,
  ]);

  return { helpOpen, setHelpOpen };
}
