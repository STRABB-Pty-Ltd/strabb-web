"use client";

import { useRouter } from "next/navigation";

import type { AlertItem } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

/** Routes to the page/submenu chip a given dashboard alert is about.
 *  Shared by AlertStrip (dashboard page) and the mobile top bar's
 *  notifications dropdown (M.1.1) - same alert data, same "View" target. */
export function useAlertNavigation() {
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const router = useRouter();

  return (alert: AlertItem) => {
    switch (alert.type) {
      case "message":
        setSubmenu("messaging", ["unread"]);
        router.push("/messaging");
        return;
      case "unscheduled":
        setSubmenu("operations", ["cleaning"]);
        router.push("/operations");
        return;
      case "past-due-clean":
        setSubmenu("operations", ["cleaning"]);
        router.push("/operations");
        return;
      case "ticket":
        setSubmenu("operations", ["tickets"]);
        router.push("/operations");
        return;
      case "sync":
        router.push("/settings");
        return;
    }
  };
}
