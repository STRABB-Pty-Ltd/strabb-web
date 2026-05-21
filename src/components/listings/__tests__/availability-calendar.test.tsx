import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useListingStateAPIMock = vi.fn();
const mutateAsyncMock = vi.fn();

vi.mock("@/lib/api-hooks/listing-state-api", () => ({
  useListingStateAPI: (...args: unknown[]) => useListingStateAPIMock(...args),
  useUpdateListingAvailability: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ addToast: vi.fn() }),
}));

import { AvailabilityCalendar } from "../availability-calendar";

function withClient(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("AvailabilityCalendar", () => {
  beforeEach(() => {
    useListingStateAPIMock.mockReset();
    mutateAsyncMock.mockReset();
    useListingStateAPIMock.mockReturnValue({ data: [], isLoading: false });
  });

  it("renders weekday headers and the month label", () => {
    render(withClient(<AvailabilityCalendar listingId="L1" />));
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("defaults cells with no override to '1 unit'", () => {
    render(withClient(<AvailabilityCalendar listingId="L1" />));
    expect(screen.getAllByText("1 unit").length).toBeGreaterThan(0);
  });

  it("renders a Blocked badge for cells with availability_count = 0", () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    useListingStateAPIMock.mockReturnValue({
      data: [
        {
          date: iso,
          rate: null,
          minStay: null,
          maxStay: null,
          closedToArrival: false,
          closedToDeparture: false,
          stopSell: false,
          availabilityCount: 0,
        },
      ],
      isLoading: false,
    });
    render(withClient(<AvailabilityCalendar listingId="L1" />));
    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });

  it("renders multi-unit count when an override is > 1", () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    useListingStateAPIMock.mockReturnValue({
      data: [
        {
          date: iso,
          rate: null,
          minStay: null,
          maxStay: null,
          closedToArrival: false,
          closedToDeparture: false,
          stopSell: false,
          availabilityCount: 3,
        },
      ],
      isLoading: false,
    });
    render(withClient(<AvailabilityCalendar listingId="L1" />));
    expect(screen.getByText("3 units")).toBeInTheDocument();
  });

  it("opens the edit dialog after selecting a cell and clicking Edit", async () => {
    const user = userEvent.setup();
    render(withClient(<AvailabilityCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    expect(cells.length).toBeGreaterThan(0);
    await user.click(cells[0]);

    const editButton = screen.getByRole("button", { name: "Edit" });
    expect(editButton).toBeEnabled();
    await user.click(editButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Bookable units/i)).toBeInTheDocument();
  });

  it("submits a single-date PATCH with count=0 (blocking the date)", async () => {
    mutateAsyncMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(withClient(<AvailabilityCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByLabelText(/Bookable units/i) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const callArg = mutateAsyncMock.mock.calls[0][0];
    expect(callArg.listingId).toBe("L1");
    expect(callArg.body.count).toBe(0);
    expect("date" in callArg.body).toBe(true);
    expect("dateFrom" in callArg.body).toBe(false);
  });

  it("submits a range PATCH when the user shift-extends the selection", async () => {
    mutateAsyncMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(withClient(<AvailabilityCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.keyboard("{Shift>}");
    await user.click(cells[5]);
    await user.keyboard("{/Shift}");

    expect(screen.getByRole("button", { name: "Edit range" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit range" }));

    const input = screen.getByLabelText(/Bookable units/i);
    await user.clear(input);
    await user.type(input, "2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const callArg = mutateAsyncMock.mock.calls[0][0];
    expect("dateFrom" in callArg.body).toBe(true);
    expect("dateTo" in callArg.body).toBe(true);
    expect(callArg.body.count).toBe(2);
  });

  it("rejects negative counts and counts > 1000", async () => {
    const user = userEvent.setup();
    render(withClient(<AvailabilityCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByLabelText(/Bookable units/i);
    await user.clear(input);
    await user.type(input, "-1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(within(screen.getByRole("dialog")).getByText(/0 to 1000/i)).toBeInTheDocument();
  });

  it("rejects fractional counts", async () => {
    const user = userEvent.setup();
    render(withClient(<AvailabilityCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByLabelText(/Bookable units/i);
    await user.clear(input);
    await user.type(input, "1.5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(within(screen.getByRole("dialog")).getByText(/whole number/i)).toBeInTheDocument();
  });
});
