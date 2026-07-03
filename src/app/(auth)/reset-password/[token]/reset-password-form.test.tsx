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

import { ResetPasswordForm } from "./reset-password-form";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    postMock.mockReset();
    pushMock.mockReset();
    postMock.mockResolvedValue(undefined);
  });

  it("posts token + new_password and redirects to login on success", async () => {
    render(<ResetPasswordForm token="tok-123" />);
    await userEvent.type(screen.getByLabelText("New password"), "abcd123456");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "abcd123456");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    // camelCase in, api-client's keysToSnake turns newPassword into new_password.
    expect(postMock).toHaveBeenCalledWith("/auth/reset-password", {
      token: "tok-123",
      newPassword: "abcd123456",
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?reset=success"));
  });

  it("rejects a weak (9-char) password without calling the API", async () => {
    render(<ResetPasswordForm token="tok-123" />);
    await userEvent.type(screen.getByLabelText("New password"), "abcd12345");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "abcd12345");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Password must be at least 10 characters")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    render(<ResetPasswordForm token="tok-123" />);
    await userEvent.type(screen.getByLabelText("New password"), "abcd123456");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "abcd123457");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("renders a single generic error on any token failure (no expired/used distinction)", async () => {
    postMock.mockRejectedValue(new Error("400"));
    render(<ResetPasswordForm token="bad" />);
    await userEvent.type(screen.getByLabelText("New password"), "abcd123456");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "abcd123456");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
