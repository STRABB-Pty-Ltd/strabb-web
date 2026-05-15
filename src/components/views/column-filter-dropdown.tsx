"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";

export interface ColumnFilterOption {
  value: string;
  label: string;
}

export interface ColumnFilterConfig {
  /** Current filter value. Empty string means "no active filter" (the reset option). */
  value: string;
  /** Options shown in the dropdown. The first option is conventionally the
   *  reset (e.g. "All statuses") with value: "". */
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
}

interface ColumnFilterDropdownProps {
  /** Column label, rendered uppercase like a normal sortable list header. */
  label: string;
  filter: ColumnFilterConfig;
}

/**
 * Header-embedded filter dropdown for SortableList columns. Replaces the
 * detached filter row pattern: the column header itself is the trigger, and
 * the active filter value (if any) shows inline next to the label.
 */
export function ColumnFilterDropdown({ label, filter }: ColumnFilterDropdownProps) {
  const selected = filter.options.find((o) => o.value === filter.value);
  const isActive = filter.value !== "";
  // Fallback label when no filter is selected. Conventionally the first option
  // is the "All ___" reset; if missing, fall back to a generic "All".
  const fallbackLabel = filter.options.find((o) => o.value === "")?.label ?? "All";
  const valueLabel = isActive && selected ? selected.label : fallbackLabel;

  return (
    <Menu.Root>
      <Menu.Trigger className="gap-xs flex min-w-0 cursor-pointer flex-col items-start rounded text-left outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2">
        <span className="gap-xs flex items-center font-semibold tracking-wide uppercase">
          <span>{label}</span>
          <ChevronDown
            size={12}
            className="opacity-60 transition-transform data-[popup-open]:rotate-180"
          />
        </span>
        <span
          className={`text-body w-full truncate font-medium normal-case ${isActive ? "" : "opacity-60"}`}
          style={{ color: "var(--highlight-10)" }}
          title={valueLabel}
        >
          {valueLabel}
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={4}
          align="start"
          // Keep the popup inside the canvas content area: top=canvas-top+space-md
          // (114+21=135), sides=space-md (21). Numeric literals mirror design-locked
          // CSS values so the popup never protrudes into the topnav/submenu rail.
          collisionPadding={{ top: 135, right: 21, bottom: 21, left: 21 }}
          style={{ zIndex: 60 }}
        >
          <Menu.Popup
            className="py-xs rounded-lg shadow-md outline-none"
            style={{
              backgroundColor: "var(--highlight-10)",
              minWidth: 180,
            }}
          >
            {filter.options.map((opt) => {
              const isSelected = opt.value === filter.value;
              return (
                <Menu.Item
                  key={opt.value || "__all__"}
                  onClick={() => filter.onChange(opt.value)}
                  className="px-sm py-base text-body gap-base flex cursor-pointer items-center justify-between transition-colors outline-none data-[highlighted]:bg-[color-mix(in_srgb,var(--surface-60)_12%,transparent)]"
                  style={{ color: "var(--surface-60)" }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={13} aria-hidden="true" />}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
