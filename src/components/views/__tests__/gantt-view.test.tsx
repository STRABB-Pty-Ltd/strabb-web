import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import { GanttView, type GanttViewProps } from "../gantt-view";

interface TestItem {
  id: string;
  rowId: string;
  label: string;
  start: Date;
  end: Date;
  color: string;
}

const today = new Date();
const dateRange = { start: today, end: addDays(today, 13) };

const rows = [
  { id: "row-1", label: "Listing A", color: "#3B82F6" },
  { id: "row-2", label: "Listing B", color: "#10B981" },
  { id: "row-3", label: "Listing C", color: "#F59E0B" },
];

const items: TestItem[] = [
  {
    id: "item-1",
    rowId: "row-1",
    label: "Guest Alpha",
    start: today,
    end: addDays(today, 3),
    color: "#FF5A5F",
  },
  {
    id: "item-2",
    rowId: "row-2",
    label: "Guest Beta",
    start: addDays(today, 2),
    end: addDays(today, 5),
    color: "#003580",
  },
];

const defaultProps: GanttViewProps<TestItem> = {
  rows,
  items,
  getRowId: (item) => item.rowId,
  getDateRange: (item) => ({ start: item.start, end: item.end }),
  getColor: (item) => item.color,
  getLabel: (item) => item.label,
  dateRange,
  onItemClick: vi.fn(),
};

describe("GanttView", () => {
  it("renders the correct number of rows", () => {
    render(<GanttView {...defaultProps} />);
    expect(screen.getByText("Listing A")).toBeInTheDocument();
    expect(screen.getByText("Listing B")).toBeInTheDocument();
    expect(screen.getByText("Listing C")).toBeInTheDocument();
  });

  it("renders bars for items", () => {
    render(<GanttView {...defaultProps} />);
    expect(screen.getByText("Guest Alpha")).toBeInTheDocument();
    expect(screen.getByText("Guest Beta")).toBeInTheDocument();
  });

  it("calls onItemClick when a bar is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<GanttView {...defaultProps} onItemClick={onClick} />);
    await user.click(screen.getByText("Guest Alpha"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(items[0]);
  });

  it("renders a today line", () => {
    const { container } = render(<GanttView {...defaultProps} />);
    const todayLine = container.querySelector('[style*="dashed"]');
    expect(todayLine).toBeInTheDocument();
  });
});
