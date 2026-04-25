import { render, screen } from "@testing-library/react";
import { addDays } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import { CalendarGrid, type CalendarGridProps } from "../calendar-grid";

interface TestEvent {
  id: string;
  label: string;
  start: Date;
  end: Date;
  color: string;
}

const today = new Date();

const defaultProps: CalendarGridProps<TestEvent> = {
  mode: "month",
  currentDate: today,
  events: [],
  getEventDate: (ev) => ({ start: ev.start, end: ev.end }),
  getEventColor: (ev) => ev.color,
  getEventLabel: (ev) => ev.label,
  onEventClick: vi.fn(),
};

describe("CalendarGrid", () => {
  it("renders 7 day-of-week labels in month mode", () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("renders events as chips", () => {
    const events: TestEvent[] = [
      {
        id: "e-1",
        label: "Booking Alpha",
        start: today,
        end: addDays(today, 2),
        color: "var(--channel-airbnb)",
      },
    ];
    render(<CalendarGrid {...defaultProps} events={events} />);
    expect(screen.getAllByText("Booking Alpha").length).toBeGreaterThan(0);
  });

  it("shows +N more when events exceed threshold", () => {
    const events: TestEvent[] = Array.from({ length: 5 }, (_, i) => ({
      id: `e-${i}`,
      label: `Event ${i}`,
      start: today,
      end: today,
      color: "var(--brand-10)",
    }));
    render(<CalendarGrid {...defaultProps} events={events} maxEventsPerCell={3} />);
    expect(screen.getAllByText("+2 more").length).toBeGreaterThan(0);
  });

  it("renders the day-of-week header row even with no events", () => {
    render(<CalendarGrid {...defaultProps} />);
    // grid renders Mon..Sun headers (verified above) plus day cells
    expect(screen.getAllByText(/^\d+$/).length).toBeGreaterThan(0);
  });
});
