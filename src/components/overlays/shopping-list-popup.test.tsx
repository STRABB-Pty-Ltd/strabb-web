import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ShoppingItem } from "@/types/shopping-item";

const addToastMock = vi.fn();
const mutateMock = vi.fn();

const shoppingItems: ShoppingItem[] = [
  {
    id: "1",
    listingId: "lst-1",
    listingName: "Beach House",
    item: "Dish soap",
    quantity: 2,
    status: "approved",
    requestedDate: "2026-05-01",
    priority: "high",
    notes: null,
    unitCost: null,
    purchasedDate: null,
  },
  {
    id: "2",
    listingId: "lst-1",
    listingName: "Beach House",
    item: "Bin liners",
    quantity: 1,
    status: "purchased",
    requestedDate: "2026-05-01",
    priority: "low",
    notes: null,
    unitCost: 3.2,
    purchasedDate: "2026-05-02",
  },
];

type MockState = {
  shoppingListPopup: { open: boolean };
  closeShoppingListPopup: () => void;
  addToast: typeof addToastMock;
  selectedListings: string[];
};

vi.mock("@/hooks/use-cleaning", () => ({
  useShoppingList: () => ({ data: shoppingItems }),
}));

vi.mock("@/lib/api-hooks/cleaning-api", () => ({
  useUpdateShoppingItemAPI: () => ({ mutate: mutateMock, isPending: false, variables: undefined }),
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
    mutateMock.mockReset();
  });

  it("copies the list to the clipboard and shows a success toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<ShoppingListPopup />);
    await userEvent.click(screen.getByRole("button", { name: /copy list/i }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith("[ ] Dish soap (x2)\n[x] Bin liners (x1)");
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

describe("ShoppingListPopup - purchase wiring", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    mutateMock.mockReset();
  });

  it("marks an item purchased with its entered price", async () => {
    render(<ShoppingListPopup />);

    const priceInput = screen.getByLabelText("Price for Dish soap");
    await userEvent.type(priceInput, "4.50");
    await userEvent.click(screen.getByRole("checkbox", { name: /dish soap/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      id: "1",
      data: { status: "purchased", unitCost: 4.5 },
    });
  });

  it("does not mutate when ticking an item with no price", async () => {
    render(<ShoppingListPopup />);

    await userEvent.click(screen.getByRole("checkbox", { name: /dish soap/i }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("un-marks a purchased item back to approved", async () => {
    render(<ShoppingListPopup />);

    await userEvent.click(screen.getByRole("checkbox", { name: /bin liners/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      id: "2",
      data: { status: "approved" },
    });
  });
});
