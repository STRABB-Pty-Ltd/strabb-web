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

const mockCreateMutateAsync = vi.fn();
vi.mock("@/hooks/use-listings", () => ({
  useCreateListing: () => ({
    mutateAsync: mockCreateMutateAsync,
    error: null,
    isPending: false,
  }),
  useUpdateListing: () => ({
    mutateAsync: vi.fn(),
    error: null,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({
    data: {
      data: [
        { id: "prop-1", name: "Beach House" },
        { id: "prop-2", name: "City Apartment" },
      ],
    },
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

import { ListingFormDialog } from "./listing-form-dialog";

function renderDialog() {
  const user = userEvent.setup();
  render(<ListingFormDialog trigger={<button>Add listing</button>} />);
  return { user };
}

describe("ListingFormDialog", () => {
  it("renders the trigger button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /add listing/i })).toBeInTheDocument();
  });

  it("opens dialog with form fields", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add listing/i }));

    expect(screen.getByText("Add Listing")).toBeInTheDocument();
    expect(screen.getByLabelText(/property/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ical feed url/i)).toBeInTheDocument();
  });

  it("shows property options in dropdown", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add listing/i }));

    const propertySelect = screen.getByLabelText(/property/i);
    const options = propertySelect.querySelectorAll("option");
    // placeholder + 2 properties
    expect(options.length).toBe(3);
    expect(options[1].textContent).toBe("Beach House");
    expect(options[2].textContent).toBe("City Apartment");
  });

  it("shows validation errors on empty submit", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add listing/i }));

    const submitBtn = screen.getByTestId("dialog-root").querySelector("button[type='submit']")!;
    await user.click(submitBtn);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it("calls create mutation with valid data", async () => {
    mockCreateMutateAsync.mockResolvedValue({});
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: /add listing/i }));

    await user.selectOptions(screen.getByLabelText(/property/i), "prop-1");
    await user.type(screen.getByLabelText(/^name/i), "Airbnb — Beach House");
    await user.selectOptions(screen.getByLabelText(/platform/i), "airbnb");

    const submitBtn = screen.getByTestId("dialog-root").querySelector("button[type='submit']")!;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: "prop-1",
          name: "Airbnb — Beach House",
          platform: "airbnb",
        }),
      );
    });
  });
});
