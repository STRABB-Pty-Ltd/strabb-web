import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
  useSession: vi.fn(() => ({
    data: {
      user: { email: "test@strabb.io", name: "Test User" },
      currentUser: {
        id: "user-1",
        tenantId: "tenant-1",
        email: "test@strabb.io",
        fullName: "Test User",
        role: "owner",
        isActive: true,
      },
      role: "owner",
    },
    status: "authenticated",
  })),
}));

import { AccountMenu } from "./account-menu";

describe("AccountMenu", () => {
  it("renders the avatar button", () => {
    render(<AccountMenu />);
    expect(screen.getByLabelText("Account menu")).toBeInTheDocument();
  });

  it("shows user email when opened", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);

    await user.click(screen.getByLabelText("Account menu"));
    expect(await screen.findByTestId("user-email")).toHaveTextContent("test@strabb.io");
  });

  it("calls signOut when sign out is clicked", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);

    await user.click(screen.getByLabelText("Account menu"));
    await user.click(await screen.findByText("Sign out"));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
