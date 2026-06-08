import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const addToastMock = vi.fn();

const shoppingItems = [
  { id: "1", item: "Dish soap", quantity: 2, priority: "high", listingName: "Beach House" },
  { id: "2", item: "Bin liners", quantity: 1, priority: "low", listingName: "Beach House" },
];

type MockState = {
  shoppingListPopup: { open: boolean };
  closeShoppingListPopup: () => void;
  operations: { boughtItems: string[] };
  toggleBoughtItem: (id: string) => void;
  addToast: typeof addToastMock;
  selectedListings: string[];
};

vi.mock("@/hooks/use-cleaning", () => ({
  useShoppingList: () => ({ data: shoppingItems }),
}));

vi.mock("@/hooks/use-delayed-close", () => ({
  useDelayedClose: () => ({ shouldRender: true }),
}));

vi.mock("@/hooks/use-click-outside", () => ({ useClickOutside: () => {} }));
vi.mock("@/hooks/use-focus-trap", () => ({ useFocusTrap: () => {} }));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: MockState) => unknown) =>
    selector({
      shoppingListPopup: { open: true },
      closeShoppingListPopup: vi.fn(),
      operations: { boughtItems: [] },
      toggleBoughtItem: vi.fn(),
      addToast: addToastMock,
      selectedListings: [],
    }),
}));

import { ShoppingListPopup } from "./shopping-list-popup";

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

describe("ShoppingListPopup - Copy List", () => {
  beforeEach(() => {
    addToastMock.mockReset();
  });

  it("copies the list to the clipboard and shows a success toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<ShoppingListPopup />);
    await userEvent.click(screen.getByRole("button", { name: /copy list/i }));

    expect(writeText).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith({
        type: "success",
        message: "Shopping list copied to clipboard",
      }),
    );
  });

  it("shows an error toast when the clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    stubClipboard(writeText);

    render(<ShoppingListPopup />);
    await userEvent.click(screen.getByRole("button", { name: /copy list/i }));

    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith({
        type: "error",
        message: "Couldn't copy the list",
      }),
    );
  });
});
