"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useShoppingList } from "@/hooks/use-cleaning";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { Z } from "@/lib/z-index";
import { useAppStore } from "@/stores/app-store";

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  low: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
};

const EXIT_MS = 200;

export function ShoppingListPopup() {
  const popupRef = useRef<HTMLDivElement>(null);
  const shoppingListPopup = useAppStore((s) => s.shoppingListPopup);
  const closeShoppingListPopup = useAppStore((s) => s.closeShoppingListPopup);
  const boughtItems = useAppStore((s) => s.cleaning.boughtItems);
  const toggleBoughtItem = useAppStore((s) => s.toggleBoughtItem);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { data: shoppingItemList = [] } = useShoppingList(selectedListings);
  const open = shoppingListPopup.open;
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const [showAll, setShowAll] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShoppingListPopup();
    },
    [closeShoppingListPopup],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  useClickOutside(popupRef, closeShoppingListPopup, open);

  if (!shouldRender) return null;

  const items = showAll
    ? shoppingItemList
    : shoppingItemList.filter((i) => !boughtItems.includes(i.id));

  // Group by listing
  const grouped = items.reduce(
    (acc, item) => {
      const key = item.listingName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );

  const handleCopyList = () => {
    const text = items
      .map((i) => `${boughtItems.includes(i.id) ? "[x]" : "[ ]"} ${i.item} (x${i.quantity})`)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const scrimAnim = !open
    ? `fadeOut ${EXIT_MS}ms ease-in forwards`
    : `fadeIn ${EXIT_MS}ms ease-out`;
  const cardAnim = !open
    ? `scaleOut ${EXIT_MS}ms ease-in forwards`
    : `scaleIn ${EXIT_MS}ms ease-out`;

  return (
    <>
      <div
        style={{
          ...canvasOverlayStyle,
          zIndex: Z.MODAL,
          backgroundColor: "var(--scrim)",
          animation: scrimAnim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={closeShoppingListPopup}
      >
        <div
          ref={popupRef}
          className="bg-surface-60 w-full max-w-lg rounded-xl shadow-xl"
          style={{ animation: cardAnim }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-sm py-sm flex items-center justify-between border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-body font-semibold">Shopping List</h2>
            <div className="gap-base flex items-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-body text-highlight-10 rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              >
                {showAll ? "Show needed only" : "Show all"}
              </button>
              <button
                type="button"
                onClick={closeShoppingListPopup}
                aria-label="Close shopping list"
                className="text-highlight-10 hover:bg-neutral-30 flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                data-no-elevate
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-sm max-h-[377px] overflow-y-auto">
            {Object.entries(grouped).map(([listing, listItems]) => (
              <div key={listing} className="mb-sm">
                <h3 className="mb-xs text-body text-highlight-10 font-semibold uppercase">
                  {listing}
                </h3>
                <div className="space-y-xs">
                  {listItems.map((item) => {
                    const isBought = boughtItems.includes(item.id);
                    const badge = priorityBadge[item.priority];
                    return (
                      <label
                        key={item.id}
                        className="gap-base px-base py-xs hover:bg-neutral-30 flex items-center rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isBought}
                          onChange={() => toggleBoughtItem(item.id)}
                          className="h-sm border-neutral-30 w-sm rounded"
                        />
                        <span
                          className="text-body flex-1"
                          style={{
                            textDecoration: isBought ? "line-through" : "none",
                            color: isBought ? "var(--highlight-10)" : "var(--highlight-10)",
                          }}
                        >
                          {item.item}
                        </span>
                        <span className="font-data text-body text-highlight-10">
                          x{item.quantity}
                        </span>
                        <span
                          className="px-base py-xs text-body rounded-md"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {item.priority}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            className="gap-base px-sm py-sm flex justify-end border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={closeShoppingListPopup}
              className="px-sm py-base text-body text-highlight-10 hover:bg-neutral-30 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="px-sm py-base text-body text-highlight-10 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              Share Link
            </button>
            <button
              type="button"
              onClick={handleCopyList}
              className="px-sm py-base text-body text-surface-60 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
            >
              Copy List
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
