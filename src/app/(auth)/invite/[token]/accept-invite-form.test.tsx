import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock, pushMock } = vi.hoisted(() => ({ postMock: vi.fn(), pushMock: vi.fn() }));

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: postMock },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { AcceptInviteForm } from "./accept-invite-form";

describe("AcceptInviteForm", () => {
  beforeEach(() => {
    postMock.mockReset();
    pushMock.mockReset();
    postMock.mockResolvedValue(undefined);
  });

  it("posts token + password + full_name and redirects to login on success", async () => {
    render(<AcceptInviteForm token="inv-123" />);
    await userEvent.type(screen.getByLabelText("Full name"), "Ada Lovelace");
    await userEvent.type(screen.getByLabelText("Password"), "abcd123456");
    await userEvent.type(screen.getByLabelText("Confirm password"), "abcd123456");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    // camelCase in, api-client's keysToSnake turns fullName into full_name.
    expect(postMock).toHaveBeenCalledWith("/invites/accept", {
      token: "inv-123",
      password: "abcd123456",
      fullName: "Ada Lovelace",
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?invited=success"));
  });

  it("rejects a blank name without calling the API", async () => {
    render(<AcceptInviteForm token="inv-123" />);
    await userEvent.type(screen.getByLabelText("Password"), "abcd123456");
    await userEvent.type(screen.getByLabelText("Confirm password"), "abcd123456");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("rejects a weak password without calling the API", async () => {
    render(<AcceptInviteForm token="inv-123" />);
    await userEvent.type(screen.getByLabelText("Full name"), "Ada");
    await userEvent.type(screen.getByLabelText("Password"), "short1");
    await userEvent.type(screen.getByLabelText("Confirm password"), "short1");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Password must be at least 10 characters")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("renders a single generic error on any token failure", async () => {
    postMock.mockRejectedValue(new Error("400"));
    render(<AcceptInviteForm token="bad" />);
    await userEvent.type(screen.getByLabelText("Full name"), "Ada");
    await userEvent.type(screen.getByLabelText("Password"), "abcd123456");
    await userEvent.type(screen.getByLabelText("Confirm password"), "abcd123456");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
