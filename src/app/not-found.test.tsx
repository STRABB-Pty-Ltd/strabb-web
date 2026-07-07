import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders the branded 404 panel with a stable test-id", () => {
    render(<NotFound />);
    expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("links home to the dashboard", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
