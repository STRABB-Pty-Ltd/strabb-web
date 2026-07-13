"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

import { severityAccent, typeIcon } from "@/app/(authenticated)/dashboard/_components/alert-strip";
import type { AlertItem } from "@/hooks/use-dashboard";
import { useAlertNavigation } from "@/hooks/use-alert-navigation";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Z } from "@/lib/z-index";

import { StrabbWordmark } from "./strabb-marks";

const EXIT_MS = 200;

interface NotificationsDropdownProps {
  alerts: AlertItem[];
}

/** Chevron next to the wordmark opens this - same alert data as the
 *  dashboard's AlertStrip, compact list instead of a card grid. Local
 *  open state (not overlay-slice): trigger and panel both live here, no
 *  other component needs to read or set it, unlike tfPopup/sharePopup
 *  which open from multiple pages. */
export function NotificationsDropdown({ alerts }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleView = useAlertNavigation();

  // Click-outside is scoped to the whole container (trigger + panel), not
  // just the panel: with just the panel, a click on the trigger itself
  // registered as "outside" on mousedown (closing it) before the trigger's
  // own onClick fired and reopened it - net effect, the dropdown never
  // stayed closed on a click of its own toggle button.
  useClickOutside(containerRef, () => setOpen(false), open);
  useFocusTrap(panelRef, { active: open, onEscape: () => setOpen(false) });

  const { shouldRender, exiting } = useDelayedClose(open, EXIT_MS);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
        className="gap-xs relative flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        data-no-elevate
      >
        <StrabbWordmark className="text-highlight-10 h-4 w-auto" />
        <ChevronDown size={14} className="text-highlight-10" aria-hidden="true" />
        {alerts.length > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-2.5 block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--status-issues)" }}
          />
        ) : null}
      </button>
      {shouldRender ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className="bg-neutral-30 absolute top-full left-1/2 mt-sm max-h-[60vh] w-[min(320px,85vw)] -translate-x-1/2 overflow-y-auto overflow-x-hidden rounded-xl border shadow-xl"
          style={{
            zIndex: Z.DRAWER,
            borderColor: "var(--border)",
            animation: exiting
              ? `fadeOut ${EXIT_MS}ms ease-in forwards`
              : `fadeIn ${EXIT_MS}ms ease-out`,
          }}
        >
          {alerts.length === 0 ? (
            <p className="text-body px-md py-base" style={{ color: "var(--text-secondary)" }}>
              No new alerts
            </p>
          ) : (
            <ul>
              {alerts.map((alert) => {
                const Icon = typeIcon[alert.type] ?? AlertTriangle;
                const accent = severityAccent[alert.severity] ?? "var(--highlight-10)";
                return (
                  <li
                    key={alert.id}
                    className="gap-sm px-md py-sm flex items-center border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Icon size={16} style={{ color: accent }} aria-hidden="true" />
                    <span
                      className="text-body min-w-0 flex-1"
                      style={{ color: "var(--highlight-10)" }}
                    >
                      {alert.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleView(alert);
                        setOpen(false);
                      }}
                      className="text-body cursor-pointer rounded font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                      style={{ color: accent }}
                      data-no-elevate
                    >
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
