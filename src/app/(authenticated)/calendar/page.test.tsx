import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { eventsMock, mobileMock, storeMock } = vi.hoisted(() => ({
  eventsMock: vi.fn(),
  mobileMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-calendar", () => ({
  useCalendarEvents: (...args: unknown[]) => eventsMock(...args),
}));

vi.mock("@/hooks/use-responsive-view", () => ({
  useMobileViewOverride: (view: string) => mobileMock(view),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("./_components/calendar-gantt-view", () => ({
  CalendarGanttView: () => <div data-testid="gantt-view" />,
}));
vi.mock("./_components/calendar-list-view", () => ({
  CalendarListView: () => <div data-testid="list-view" />,
}));
vi.mock("./_components/calendar-month-view", () => ({
  CalendarMonthView: () => <div data-testid="month-view" />,
}));

import CalendarPage from "./page";

const storeFor = (view: string) => ({
  calendar: { view, submenu: [], windowSize: "month", anchor: null },
  selectedListings: [],
});

describe("CalendarPage", () => {
  beforeEach(() => {
    eventsMock.mockReset();
    mobileMock.mockReset();
    storeMock.mockReset();
  });

  it("renders the loading skeleton when events query is loading", () => {
    storeMock.mockReturnValue(storeFor("gantt"));
    eventsMock.mockReturnValue({ data: undefined, isLoading: true });
    mobileMock.mockReturnValue({ effectiveView: "gantt", showMobileBanner: false });
    render(<CalendarPage />);
    expect(screen.getByText(/loading calendar/i)).toBeInTheDocument();
    expect(screen.queryByTestId("gantt-view")).not.toBeInTheDocument();
  });

  it("renders the Gantt view when effective view is gantt", () => {
    storeMock.mockReturnValue(storeFor("gantt"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    mobileMock.mockReturnValue({ effectiveView: "gantt", showMobileBanner: false });
    render(<CalendarPage />);
    expect(screen.getByTestId("gantt-view")).toBeInTheDocument();
    expect(screen.queryByTestId("month-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("list-view")).not.toBeInTheDocument();
  });

  it("dispatches to the list view when effective view is list", () => {
    storeMock.mockReturnValue(storeFor("list"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    mobileMock.mockReturnValue({ effectiveView: "list", showMobileBanner: false });
    render(<CalendarPage />);
    expect(screen.getByTestId("list-view")).toBeInTheDocument();
  });

  it("shows the mobile banner when the responsive override forces a different view", () => {
    storeMock.mockReturnValue(storeFor("gantt"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    mobileMock.mockReturnValue({ effectiveView: "list", showMobileBanner: true });
    render(<CalendarPage />);
    expect(screen.getByText(/switch to desktop/i)).toBeInTheDocument();
    expect(screen.getByTestId("list-view")).toBeInTheDocument();
  });
});
