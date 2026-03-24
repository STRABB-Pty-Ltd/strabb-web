import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { accessToken: "mock-token" },
    status: "authenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockMutateAsync = vi.fn();
vi.mock("@/hooks/use-properties", () => ({
  useCreateProperty: () => ({
    mutateAsync: mockMutateAsync,
    error: null,
    isPending: false,
  }),
  useUpdateProperty: () => ({
    mutateAsync: vi.fn(),
    error: null,
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@base-ui/react/dialog", async () => {
  const { mockDialogModule } = await import("@/test-utils/mock-dialog");
  return mockDialogModule;
});

import { PropertyFormDialog } from "./property-form-dialog";

function renderDialog() {
  const user = userEvent.setup();
  render(<PropertyFormDialog trigger={<button>Add property</button>} />);
  return { user };
}

describe("PropertyFormDialog", () => {
  it("renders the trigger button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /add property/i })).toBeInTheDocument();
  });

  it("opens dialog on trigger click and shows form fields", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add property/i }));

    expect(screen.getByText("Add Property")).toBeInTheDocument();
    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cleaning time/i)).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add property/i }));

    const nameInput = screen.getByLabelText("Name *");
    await user.clear(nameInput);

    const submitBtn = screen.getByTestId("dialog-root").querySelector("button[type='submit']")!;
    await user.click(submitBtn);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it("calls create mutation with valid data", async () => {
    mockMutateAsync.mockResolvedValue({});
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add property/i }));

    const nameInput = screen.getByLabelText("Name *");
    await user.clear(nameInput);
    await user.type(nameInput, "Beach House");

    const submitBtn = screen.getByTestId("dialog-root").querySelector("button[type='submit']")!;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Beach House" }),
      );
    });
  });
});
