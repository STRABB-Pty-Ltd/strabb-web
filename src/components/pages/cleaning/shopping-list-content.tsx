"use client";

import { useShoppingList } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "#FEE2E2", text: "#DC2626" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low: { bg: "#F3F4F6", text: "#6B7280" },
};

export function ShoppingListContent() {
  const selectedListings = useAppStore((s) => s.selectedListings);
  const boughtItems = useAppStore((s) => s.cleaning.boughtItems);
  const toggleBoughtItem = useAppStore((s) => s.toggleBoughtItem);

  const { data: items } = useShoppingList(selectedListings);

  const grouped = items.reduce(
    (acc, item) => {
      const key = item.listingName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );

  const handleCopy = () => {
    const text = items
      .map(
        (i) =>
          `${boughtItems.includes(i.id) ? "[x]" : "[ ]"} ${i.item} (x${i.quantity})`,
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(grouped).map(([listing, listItems]) => (
          <div key={listing} className="mb-4">
            <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
              {listing}
            </h3>
            <div className="space-y-1">
              {listItems.map((item) => {
                const isBought = boughtItems.includes(item.id);
                const badge = priorityBadge[item.priority] ?? priorityBadge.low;
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
                    <span className="font-data text-xs text-gray-500">
                      x{item.quantity}
                    </span>
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

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled
          className="rounded-lg px-4 py-2 text-sm text-gray-400"
        >
          Share Link
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg px-4 py-2 text-sm text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          Copy List
        </button>
      </div>
    </div>
  );
}
