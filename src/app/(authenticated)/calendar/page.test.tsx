import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { eventsMock, isMobileMock, storeMock } = vi.hoisted(() => ({
  eventsMock: vi.fn(),
  isMobileMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-calendar", () => ({
  useCalendarEvents: (...args: unknown[]) => eventsMock(...args),
}));

vi.mock("@/hooks/use-responsive-view", () => ({
  useIsMobile: (...args: unknown[]) => isMobileMock(...args),
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
vi.mock("./_components/calendar-agenda-view", () => ({
  CalendarAgendaView: () => <div data-testid="agenda-view" />,
}));

import CalendarPage from "./page";

const storeFor = (view: string) => ({
  calendar: { view, submenu: [], windowSize: "month", anchor: null },
  selectedListings: [],
});

describe("CalendarPage", () => {
  beforeEach(() => {
    eventsMock.mockReset();
    isMobileMock.mockReset();
    isMobileMock.mockReturnValue(false);
    storeMock.mockReset();
  });

  it("renders the loading skeleton when events query is loading", () => {
    storeMock.mockReturnValue(storeFor("gantt"));
    eventsMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<CalendarPage />);
    expect(screen.getByText(/loading calendar/i)).toBeInTheDocument();
    expect(screen.queryByTestId("gantt-view")).not.toBeInTheDocument();
  });

  it("renders the Gantt view when view is gantt", () => {
    storeMock.mockReturnValue(storeFor("gantt"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    render(<CalendarPage />);
    expect(screen.getByTestId("gantt-view")).toBeInTheDocument();
    expect(screen.queryByTestId("month-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("agenda-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("list-view")).not.toBeInTheDocument();
  });

  it("renders the list view when view is list", () => {
    storeMock.mockReturnValue(storeFor("list"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    render(<CalendarPage />);
    expect(screen.getByTestId("list-view")).toBeInTheDocument();
  });

  it("renders the month grid for calendar view on desktop", () => {
    storeMock.mockReturnValue(storeFor("calendar"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    isMobileMock.mockReturnValue(false);
    render(<CalendarPage />);
    expect(screen.getByTestId("month-view")).toBeInTheDocument();
    expect(screen.queryByTestId("agenda-view")).not.toBeInTheDocument();
  });

  it("renders the agenda list for calendar view on mobile", () => {
    storeMock.mockReturnValue(storeFor("calendar"));
    eventsMock.mockReturnValue({ data: [], isLoading: false });
    isMobileMock.mockReturnValue(true);
    render(<CalendarPage />);
    expect(screen.getByTestId("agenda-view")).toBeInTheDocument();
    expect(screen.queryByTestId("month-view")).not.toBeInTheDocument();
  });
});
