"use client";

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

export function useMobileViewOverride(currentView: string) {
  const isMobile = useIsMobile();
  const needsOverride = isMobile && (currentView === "gantt" || currentView === "calendar");
  return {
    effectiveView: needsOverride ? "list" : currentView,
    showMobileBanner: needsOverride,
    isMobile,
  };
}
