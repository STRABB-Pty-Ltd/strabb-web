import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { tasksMock, listingsMock, propertiesMock, storeMock } = vi.hoisted(() => ({
  tasksMock: vi.fn(),
  listingsMock: vi.fn(),
  propertiesMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-cleaning", () => ({
  useCleaningTasks: (...args: unknown[]) => tasksMock(...args),
}));
vi.mock("@/hooks/use-listings", () => ({
  useListings: () => listingsMock(),
}));
vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      ...storeMock(),
      // Cover stale store-selector reads from the ShoppingListPopup mock below
      shoppingListPopup: { open: false },
      closeShoppingListPopup: vi.fn(),
    }),
}));

vi.mock("./_components/cleaning-kanban-view", () => ({
  CleaningKanbanView: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="kanban-view">{tasks.length} tasks</div>
  ),
}));
vi.mock("./_components/cleaning-list-view", () => ({
  CleaningListView: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="list-view">{tasks.length} tasks</div>
  ),
}));
vi.mock("@/components/overlays/shopping-list-popup", () => ({
  ShoppingListPopup: () => <div data-testid="shopping-list-popup" />,
}));

import CleaningPage from "./page";

const storeFor = (view: string) => ({
  cleaning: { view, submenu: [] },
  selectedListings: [],
});

describe("CleaningPage", () => {
  beforeEach(() => {
    tasksMock.mockReset();
    listingsMock.mockReset();
    propertiesMock.mockReset();
    storeMock.mockReset();
    listingsMock.mockReturnValue({ data: { data: [] } });
    propertiesMock.mockReturnValue({ data: { data: [] } });
  });

  it("renders the loading skeleton when tasks query is loading", () => {
    storeMock.mockReturnValue(storeFor("kanban"));
    tasksMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<CleaningPage />);
    expect(screen.getByText(/loading cleaning tasks/i)).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-view")).not.toBeInTheDocument();
  });

  it("renders the kanban view when view=kanban", () => {
    storeMock.mockReturnValue(storeFor("kanban"));
    tasksMock.mockReturnValue({ data: [{ id: "ct-1" }, { id: "ct-2" }], isLoading: false });
    render(<CleaningPage />);
    expect(screen.getByTestId("kanban-view")).toHaveTextContent("2 tasks");
    expect(screen.queryByTestId("list-view")).not.toBeInTheDocument();
  });

  it("renders the list view when view=list", () => {
    storeMock.mockReturnValue(storeFor("list"));
    tasksMock.mockReturnValue({ data: [{ id: "ct-1" }], isLoading: false });
    render(<CleaningPage />);
    expect(screen.getByTestId("list-view")).toHaveTextContent("1 tasks");
    expect(screen.queryByTestId("kanban-view")).not.toBeInTheDocument();
  });

  it("always renders the shopping list popup at the page root", () => {
    storeMock.mockReturnValue(storeFor("list"));
    tasksMock.mockReturnValue({ data: [], isLoading: false });
    render(<CleaningPage />);
    expect(screen.getByTestId("shopping-list-popup")).toBeInTheDocument();
  });
});
