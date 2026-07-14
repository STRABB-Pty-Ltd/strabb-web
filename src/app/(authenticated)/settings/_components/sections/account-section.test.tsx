import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const signOutMock = vi.fn();
vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    currentUser: { fullName: "Jess Flynn", email: "will@strabb.io" },
  }),
}));

import { AccountSection } from "./account-section";

describe("AccountSection", () => {
  it("shows who is signed in", () => {
    render(<AccountSection />);
    expect(screen.getByText("Jess Flynn")).toBeInTheDocument();
    expect(screen.getByText("will@strabb.io")).toBeInTheDocument();
  });

  it("signs out back to /login", async () => {
    render(<AccountSection />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
