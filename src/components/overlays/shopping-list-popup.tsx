"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useShoppingList } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  low: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
};

const EXIT_MS = 200;

export function ShoppingListPopup() {
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

  const scrimAnim = !open ? `fadeOut ${EXIT_MS}ms ease forwards` : `fadeIn ${EXIT_MS}ms ease`;
  const cardAnim = !open ? `scaleOut ${EXIT_MS}ms ease forwards` : `scaleIn ${EXIT_MS}ms ease`;

  return (
    <>
      <div
        className="fixed inset-0 z-[180] bg-black/30"
        style={{ animation: scrimAnim }}
        onClick={closeShoppingListPopup}
      />
      <div className="fixed inset-0 z-[185] flex items-center justify-center">
        <div
          className="w-full max-w-lg rounded-xl bg-white shadow-xl"
          style={{ animation: cardAnim }}
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
                className="text-body text-gray-500 hover:underline"
              >
                {showAll ? "Show needed only" : "Show all"}
              </button>
              <button
                type="button"
                onClick={closeShoppingListPopup}
                aria-label="Close shopping list"
                className="p-xs rounded text-gray-400 hover:bg-gray-100"
                data-no-elevate
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-sm max-h-[377px] overflow-y-auto">
            {Object.entries(grouped).map(([listing, listItems]) => (
              <div key={listing} className="mb-sm">
                <h3 className="mb-xs text-body font-semibold text-gray-500 uppercase">{listing}</h3>
                <div className="space-y-xs">
                  {listItems.map((item) => {
                    const isBought = boughtItems.includes(item.id);
                    const badge = priorityBadge[item.priority];
                    return (
                      <label
                        key={item.id}
                        className="gap-base px-base py-xs flex items-center rounded hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={isBought}
                          onChange={() => toggleBoughtItem(item.id)}
                          className="h-sm w-sm rounded border-gray-300"
                        />
                        <span
                          className="text-body flex-1"
                          style={{
                            textDecoration: isBought ? "line-through" : "none",
                            color: isBought ? "var(--brand-10)" : "var(--brand-10)",
                          }}
                        >
                          {item.item}
                        </span>
                        <span className="font-data text-body text-gray-500">x{item.quantity}</span>
                        <span
                          className="px-base py-xs text-body rounded-full"
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
              className="px-sm py-base text-body rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="px-sm py-base text-body rounded-lg text-gray-400"
            >
              Share Link
            </button>
            <button
              type="button"
              onClick={handleCopyList}
              className="px-sm py-base text-body rounded-lg text-white"
              style={{ backgroundColor: "var(--strabb-secondary)" }}
            >
              Copy List
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
