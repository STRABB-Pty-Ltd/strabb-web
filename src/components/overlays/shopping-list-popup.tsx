"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

import { useShoppingList } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "#FEE2E2", text: "#DC2626" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low: { bg: "#F3F4F6", text: "#6B7280" },
};

export function ShoppingListPopup() {
  const shoppingListPopup = useAppStore((s) => s.shoppingListPopup);
  const closeShoppingListPopup = useAppStore((s) => s.closeShoppingListPopup);
  const boughtItems = useAppStore((s) => s.cleaning.boughtItems);
  const toggleBoughtItem = useAppStore((s) => s.toggleBoughtItem);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { data: shoppingItemList = [] } = useShoppingList(selectedListings);

  const [showAll, setShowAll] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShoppingListPopup();
    },
    [closeShoppingListPopup],
  );

  useEffect(() => {
    if (shoppingListPopup.open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [shoppingListPopup.open, handleKeyDown]);

  if (!shoppingListPopup.open) return null;

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
    const text = items.map((i) => `${boughtItems.includes(i.id) ? "[x]" : "[ ]"} ${i.item} (x${i.quantity})`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div className="fixed inset-0 z-[180] bg-black/30" onClick={closeShoppingListPopup} />
      <div className="fixed inset-0 z-[185] flex items-center justify-center">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-sm font-semibold">Shopping List</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-gray-500 hover:underline"
              >
                {showAll ? "Show needed only" : "Show all"}
              </button>
              <button
                type="button"
                onClick={closeShoppingListPopup}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {Object.entries(grouped).map(([listing, listItems]) => (
              <div key={listing} className="mb-4">
                <h3 className="mb-1 text-xs font-semibold text-gray-500 uppercase">{listing}</h3>
                <div className="space-y-1">
                  {listItems.map((item) => {
                    const isBought = boughtItems.includes(item.id);
                    const badge = priorityBadge[item.priority];
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={isBought}
                          onChange={() => toggleBoughtItem(item.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span
                          className="flex-1 text-sm"
                          style={{
                            textDecoration: isBought ? "line-through" : "none",
                            color: isBought ? "#9CA3AF" : "#374151",
                          }}
                        >
                          {item.item}
                        </span>
                        <span className="font-data text-xs text-gray-500">x{item.quantity}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
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
            className="flex justify-end gap-2 border-t px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={closeShoppingListPopup}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg px-4 py-2 text-sm text-gray-400"
            >
              Share Link
            </button>
            <button
              type="button"
              onClick={handleCopyList}
              className="rounded-lg px-4 py-2 text-sm text-white"
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
