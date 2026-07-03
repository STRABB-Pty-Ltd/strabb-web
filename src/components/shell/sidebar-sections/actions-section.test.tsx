import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ openSharePopup: vi.fn() }),
}));

import { ActionsSection } from "./actions-section";

describe("ActionsSection", () => {
  it("renders Automations as an enabled link to the templates page (B.7)", () => {
    render(<ActionsSection />);
    const automations = screen.getByRole("link", { name: /automations/i });
    expect(automations).toBeInTheDocument();
    expect(automations).toHaveAttribute("href", "/messaging/templates");
    // The old dead button was disabled; the link has no disabled state.
    expect(automations).not.toHaveAttribute("disabled");
  });
});
