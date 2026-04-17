"use client";

import { useShoppingList } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  low: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
};

export function ShoppingListContent() {
  const selectedListings = useAppStore((s) => s.selectedListings);
  const boughtItems = useAppStore((s) => s.cleaning.boughtItems);
  const toggleBoughtItem = useAppStore((s) => s.toggleBoughtItem);

  const { data: rawItems } = useShoppingList(selectedListings);
  const items = rawItems ?? [];

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
      .map((i) => `${boughtItems.includes(i.id) ? "[x]" : "[ ]"} ${i.item} (x${i.quantity})`)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div className="max-h-[377px] overflow-y-auto">
        {Object.entries(grouped).map(([listing, listItems]) => (
          <div key={listing} className="mb-sm">
            <h3 className="mb-xs text-body font-semibold text-gray-500 uppercase">{listing}</h3>
            <div className="space-y-xs">
              {listItems.map((item) => {
                const isBought = boughtItems.includes(item.id);
                const badge = priorityBadge[item.priority] ?? priorityBadge.low;
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-base rounded-sm px-base py-xs hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={isBought}
                      onChange={() => toggleBoughtItem(item.id)}
                      className="h-sm w-sm rounded-sm border-gray-300"
                    />
                    <span
                      className="flex-1 text-body"
                      style={{
                        textDecoration: isBought ? "line-through" : "none",
                        color: isBought ? "var(--brand-10)" : "var(--brand-10)",
                      }}
                    >
                      {item.item}
                    </span>
                    <span className="font-data text-body text-gray-500">x{item.quantity}</span>
                    <span
                      className="rounded-full px-base py-xs text-body"
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

      <div className="mt-sm flex justify-end gap-base">
        <button type="button" disabled className="rounded-lg px-sm py-base text-body text-gray-400">
          Share Link
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg px-sm py-base text-body text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          Copy List
        </button>
      </div>
    </div>
  );
}
