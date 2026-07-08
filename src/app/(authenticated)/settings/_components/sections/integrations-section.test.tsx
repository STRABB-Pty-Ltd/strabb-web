import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const addToastMock = vi.fn();

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import { IntegrationsSection } from "./integrations-section";

describe("IntegrationsSection", () => {
  beforeEach(() => {
    addToastMock.mockReset();
  });

  it("renders the integration rows with their status badges", () => {
    render(<IntegrationsSection />);

    expect(screen.getByText("Channex")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /listings & mapping/i })).toBeInTheDocument();
    expect(screen.getByText("iCal feeds")).toBeInTheDocument();
    expect(screen.getByText("Xero")).toBeInTheDocument();
  });

  it("does not render the removed iCal add-feed affordance", () => {
    render(<IntegrationsSection />);

    expect(screen.queryByText("Add an iCal feed")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("https://example.com/calendar.ics"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add feed/i })).not.toBeInTheDocument();
    // The section has no form inputs at all after the removal.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("still toasts for coming-soon integrations via the notify button", async () => {
    render(<IntegrationsSection />);

    const [firstNotify] = screen.getAllByRole("button", { name: /notify me when this lands/i });
    await userEvent.click(firstNotify);

    expect(addToastMock).toHaveBeenCalledWith({
      type: "info",
      message: "Xero setup is coming soon",
    });
  });
});
