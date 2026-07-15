"use client";

import { useId, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useShoppingList } from "@/hooks/use-cleaning";
import { useUpdateShoppingItemAPI } from "@/lib/api-hooks/cleaning-api";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { Z } from "@/lib/z-index";
import { useAppStore } from "@/stores/app-store";
import type { ShoppingItem } from "@/types/shopping-item";

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  low: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
};

const EXIT_MS = 200;

function ShoppingRow({
  item,
  onMark,
  onUnmark,
  isPending,
}: {
  item: ShoppingItem;
  onMark: (unitCost: number) => void;
  onUnmark: () => void;
  isPending: boolean;
}) {
  const [price, setPrice] = useState(item.unitCost != null ? String(item.unitCost) : "");
  const priceInputRef = useRef<HTMLInputElement>(null);
  const isBought = item.status === "purchased";
  const badge = priorityBadge[item.priority];

  const handleToggle = () => {
    if (isBought) {
      onUnmark();
      return;
    }
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) {
      priceInputRef.current?.focus();
      return;
    }
    onMark(value);
  };

  return (
    <label className="gap-base px-base py-xs hover:bg-neutral-30 flex items-center rounded">
      <input
        type="checkbox"
        checked={isBought}
        disabled={isPending}
        onChange={handleToggle}
        className="h-sm border-neutral-30 w-sm rounded"
      />
      <span
        className="text-body flex-1"
        style={{ textDecoration: isBought ? "line-through" : "none" }}
      >
        {item.item}
      </span>
      <span className="font-data text-body text-highlight-10">x{item.quantity}</span>
      {isBought ? (
        item.unitCost != null && (
          <span className="font-data text-body text-highlight-10">${item.unitCost.toFixed(2)}</span>
        )
      ) : (
        <span className="gap-xs text-body text-highlight-10 flex items-center">
          $
          <Input
            ref={priceInputRef}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            disabled={isPending}
            onChange={(e) => setPrice(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Price for ${item.item}`}
            className="font-data w-[64px]"
          />
        </span>
      )}
      <Chip size="sm" radius="md" style={{ backgroundColor: badge.bg, color: badge.text }}>
        {item.priority}
      </Chip>
    </label>
  );
}

export function ShoppingListPopup() {
  const popupRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const shoppingListPopup = useAppStore((s) => s.shoppingListPopup);
  const closeShoppingListPopup = useAppStore((s) => s.closeShoppingListPopup);
  const addToast = useAppStore((s) => s.addToast);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { data: shoppingItemList = [] } = useShoppingList(selectedListings);
  const updateItem = useUpdateShoppingItemAPI();
  const open = shoppingListPopup.open;
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const [showAll, setShowAll] = useState(true);

  useClickOutside(popupRef, closeShoppingListPopup, open);
  // No onEscape here - useKeyboardShortcuts' centralized chain owns Escape
  // for this popup (checked before MobileNavDrawer, which it can open from
  // inside of on mobile). Wiring both here and there raced: this trap's
  // document-level listener fired first, closing the popup itself, so by
  // the time the chain's window-level handler ran, shoppingListPopup.open
  // already read false and it fell through to close the drawer underneath too.
  useFocusTrap(popupRef, { active: open });

  if (!shouldRender) return null;

  const items = showAll
    ? shoppingItemList
    : shoppingItemList.filter((i) => i.status !== "purchased");

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
      .map((i) => `${i.status === "purchased" ? "[x]" : "[ ]"} ${i.item} (x${i.quantity})`)
      .join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => addToast({ type: "success", message: "Shopping list copied to clipboard" }))
      .catch(() => addToast({ type: "error", message: "Couldn't copy the list" }));
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
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="bg-surface-60 w-full max-w-lg rounded-xl shadow-xl"
          style={{ animation: cardAnim }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-sm py-sm flex items-center justify-between border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 id={titleId} className="text-body font-semibold">
              Shopping List
            </h2>
            <div className="gap-base flex items-center">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="hover:underline"
              >
                {showAll ? "Show needed only" : "Show all"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-touch"
                onClick={closeShoppingListPopup}
                aria-label="Close shopping list"
                data-no-elevate
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          <div className="p-sm max-h-[377px] overflow-y-auto">
            {Object.entries(grouped).map(([listing, listItems]) => (
              <div key={listing} className="mb-sm">
                <h3 className="mb-xs text-body text-highlight-10 font-semibold uppercase">
                  {listing}
                </h3>
                <div className="space-y-xs">
                  {listItems.map((item) => (
                    <ShoppingRow
                      key={item.id}
                      item={item}
                      onMark={(unitCost) =>
                        updateItem.mutate({ id: item.id, data: { status: "purchased", unitCost } })
                      }
                      onUnmark={() =>
                        updateItem.mutate({ id: item.id, data: { status: "approved" } })
                      }
                      isPending={updateItem.isPending && updateItem.variables?.id === item.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="gap-base px-sm py-sm flex justify-end border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <Button type="button" variant="ghost" onClick={closeShoppingListPopup}>
              Close
            </Button>
            <Button type="button" onClick={handleCopyList}>
              Copy List
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
