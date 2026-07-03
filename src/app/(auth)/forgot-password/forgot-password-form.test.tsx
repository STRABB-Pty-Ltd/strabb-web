import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: postMock },
}));

import { ForgotPasswordForm } from "./forgot-password-form";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue(undefined);
  });

  it("posts the email to /auth/forgot-password and shows the generic confirmation", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "owner@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "owner@example.com",
    });
    expect(await screen.findByText(/if that email address has an account/i)).toBeInTheDocument();
  });

  it("shows the same confirmation even when the request fails (enumeration parity)", async () => {
    postMock.mockRejectedValue(new Error("boom"));
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "unknown@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/if that email address has an account/i)).toBeInTheDocument();
  });

  it("blocks submission and does not call the API for an invalid email", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });
});
