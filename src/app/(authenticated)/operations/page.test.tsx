import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { tasksMock, storeMock } = vi.hoisted(() => ({
  tasksMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-cleaning", () => ({
  useCleaningTasks: (...args: unknown[]) => tasksMock(...args),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      ...storeMock(),
      shoppingListPopup: { open: false },
      closeShoppingListPopup: vi.fn(),
    }),
}));

vi.mock("./_components/operations-overview-view", () => ({
  OperationsOverviewView: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="overview-view">{tasks.length} tasks</div>
  ),
}));
vi.mock("./_components/operations-cleans-view", () => ({
  OperationsCleansView: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="cleans-view">{tasks.length} tasks</div>
  ),
}));
vi.mock("./_components/operations-tickets-view", () => ({
  OperationsTicketsView: () => <div data-testid="tickets-view" />,
}));

import OperationsPage from "./page";

const storeFor = (submenu: string[]) => ({
  operations: { submenu },
  selectedListings: [],
});

describe("OperationsPage", () => {
  beforeEach(() => {
    tasksMock.mockReset();
    storeMock.mockReset();
  });

  it("renders the loading skeleton when tasks query is loading", () => {
    storeMock.mockReturnValue(storeFor(["overview"]));
    tasksMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<OperationsPage />);
    expect(screen.getByText(/loading operations/i)).toBeInTheDocument();
    expect(screen.queryByTestId("overview-view")).not.toBeInTheDocument();
  });

  it("renders the overview view when submenu=overview", () => {
    storeMock.mockReturnValue(storeFor(["overview"]));
    tasksMock.mockReturnValue({ data: [{ id: "ct-1" }, { id: "ct-2" }], isLoading: false });
    render(<OperationsPage />);
    expect(screen.getByTestId("overview-view")).toHaveTextContent("2 tasks");
    expect(screen.queryByTestId("cleans-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tickets-view")).not.toBeInTheDocument();
  });

  it("renders the cleans view when submenu=cleaning", () => {
    storeMock.mockReturnValue(storeFor(["cleaning"]));
    tasksMock.mockReturnValue({ data: [{ id: "ct-1" }], isLoading: false });
    render(<OperationsPage />);
    expect(screen.getByTestId("cleans-view")).toHaveTextContent("1 tasks");
    expect(screen.queryByTestId("overview-view")).not.toBeInTheDocument();
  });

  it("renders the tickets view when submenu=tickets", () => {
    storeMock.mockReturnValue(storeFor(["tickets"]));
    tasksMock.mockReturnValue({ data: [], isLoading: false });
    render(<OperationsPage />);
    expect(screen.getByTestId("tickets-view")).toBeInTheDocument();
  });
});
