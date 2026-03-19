import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "./data-table";

interface TestRow {
  name: string;
  email: string;
}

const columns = [
  { key: "name" as const, header: "Name" },
  { key: "email" as const, header: "Email" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={[{ name: "Alice", email: "a@b.com" }]} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders row data", () => {
    const data: TestRow[] = [
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ];
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getAllByText("Alice")).toHaveLength(1);
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });

  it("shows empty message when no data", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows custom empty message", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
