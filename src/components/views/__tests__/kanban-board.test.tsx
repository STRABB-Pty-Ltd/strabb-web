import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KanbanBoard, type KanbanBoardProps } from "../kanban-board";

interface TestItem {
  id: string;
  title: string;
  color: string;
}

const columns = [
  {
    id: "todo",
    label: "To Do",
    items: [
      { id: "t-1", title: "Task 1", color: "var(--highlight-10)" },
      { id: "t-2", title: "Task 2", color: "var(--status-success)" },
    ],
  },
  {
    id: "in_progress",
    label: "In Progress",
    items: [{ id: "t-3", title: "Task 3", color: "var(--status-danger)" }],
  },
  {
    id: "done",
    label: "Done",
    items: [],
  },
];

const defaultProps: KanbanBoardProps<TestItem> = {
  columns,
  renderCard: (item) => <div>{item.title}</div>,
  getItemId: (item) => item.id,
  getBorderColor: (item) => item.color,
};

describe("KanbanBoard", () => {
  it("renders the correct number of columns", () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders column count badges", () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByText("2")).toBeInTheDocument(); // To Do has 2
    expect(screen.getByText("1")).toBeInTheDocument(); // In Progress has 1
    expect(screen.getByText("0")).toBeInTheDocument(); // Done has 0
  });

  it("renders cards in the correct columns", () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("Task 3")).toBeInTheDocument();
  });
});
