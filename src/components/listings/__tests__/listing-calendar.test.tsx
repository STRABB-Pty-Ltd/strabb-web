import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useListingStateAPIMock = vi.fn();
const updateRatesMock = vi.fn();
const updateRestrictionsMock = vi.fn();
const updateAvailabilityMock = vi.fn();

vi.mock("@/lib/api-hooks/listing-state-api", () => ({
  useListingStateAPI: (...args: unknown[]) => useListingStateAPIMock(...args),
  useUpdateListingRates: () => ({ mutateAsync: updateRatesMock, isPending: false }),
  useUpdateListingRestrictions: () => ({ mutateAsync: updateRestrictionsMock, isPending: false }),
  useUpdateListingAvailability: () => ({ mutateAsync: updateAvailabilityMock, isPending: false }),
}));

const addToastMock = vi.fn();
vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ addToast: addToastMock }),
}));

import { ListingCalendar } from "../listing-calendar";

function withClient(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("ListingCalendar", () => {
  beforeEach(() => {
    useListingStateAPIMock.mockReset();
    updateRatesMock.mockReset();
    updateRestrictionsMock.mockReset();
    updateAvailabilityMock.mockReset();
    addToastMock.mockReset();
    useListingStateAPIMock.mockReturnValue({ data: [], isLoading: false });
    updateRatesMock.mockResolvedValue(undefined);
    updateRestrictionsMock.mockResolvedValue(undefined);
    updateAvailabilityMock.mockResolvedValue(undefined);
  });

  it("renders the weekday headers", () => {
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("queries listing-state with the visible window", () => {
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    expect(useListingStateAPIMock).toHaveBeenCalled();
    const [listingId, dateFrom, dateTo] = useListingStateAPIMock.mock.calls[0];
    expect(listingId).toBe("L1");
    expect(dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shows the base nightly rate when no override exists", () => {
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    expect(screen.getAllByText(/\$285\.00/).length).toBeGreaterThan(0);
  });

  it("shows restriction badges + non-default availability count when a row has them", () => {
    useListingStateAPIMock.mockReturnValue({
      data: [
        {
          date: "2099-01-15",
          rate: null,
          minStay: 3,
          maxStay: null,
          closedToArrival: true,
          closedToDeparture: false,
          stopSell: false,
          availabilityCount: 2,
        },
      ],
      isLoading: false,
    });
    // Navigate to Jan 2099 so the seeded row is in view.
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={null} />));
    // The exact rendered text depends on which month is open by default
    // (current month) — instead drive the test by re-rendering with a
    // row inside the current month's grid. Use a date in the wide
    // grid: today's date.
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    useListingStateAPIMock.mockReturnValue({
      data: [
        {
          date: iso,
          rate: null,
          minStay: 3,
          maxStay: null,
          closedToArrival: true,
          closedToDeparture: false,
          stopSell: true,
          availabilityCount: 2,
        },
      ],
      isLoading: false,
    });
    // Re-render with the new mock.
    const { rerender } = render(
      withClient(<ListingCalendar listingId="L1" baseNightlyRate={null} />),
    );
    rerender(withClient(<ListingCalendar listingId="L1" baseNightlyRate={null} />));
    expect(screen.getAllByText(/min 3/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("CTA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("STOP").length).toBeGreaterThan(0);
  });

  it("opens the edit dialog after selecting a cell and clicking Edit", async () => {
    const user = userEvent.setup();
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));

    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    expect(cells.length).toBeGreaterThan(0);
    await user.click(cells[0]);

    const editButton = screen.getByRole("button", { name: "Edit" });
    expect(editButton).toBeEnabled();
    await user.click(editButton);

    expect(screen.getByText(/Edit calendar/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Nightly rate (AUD)")).toBeInTheDocument();
    expect(screen.getByLabelText("Bookable units")).toBeInTheDocument();
    expect(screen.getByLabelText("Min stay (nights)")).toBeInTheDocument();
  });

  it("fires only the changed mutation when only rate is set", async () => {
    const user = userEvent.setup();
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const rateInput = screen.getByLabelText("Nightly rate (AUD)");
    await user.clear(rateInput);
    await user.type(rateInput, "350");

    // Leave count input untouched at its pre-filled default (1) so the
    // dialog doesn't fire an availability mutation either — we only
    // want to verify the rate path here.
    const countInput = screen.getByLabelText("Bookable units");
    await user.clear(countInput);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRatesMock).toHaveBeenCalledTimes(1);
    expect(updateRatesMock.mock.calls[0][0].body).toMatchObject({ rate: 350 });
    expect(updateRestrictionsMock).not.toHaveBeenCalled();
    expect(updateAvailabilityMock).not.toHaveBeenCalled();
  });

  it("fires all three mutations in parallel when the form sets rate + count + restriction", async () => {
    const user = userEvent.setup();
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.clear(screen.getByLabelText("Nightly rate (AUD)"));
    await user.type(screen.getByLabelText("Nightly rate (AUD)"), "350");

    await user.clear(screen.getByLabelText("Bookable units"));
    await user.type(screen.getByLabelText("Bookable units"), "2");

    await user.clear(screen.getByLabelText("Min stay (nights)"));
    await user.type(screen.getByLabelText("Min stay (nights)"), "3");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRatesMock).toHaveBeenCalledTimes(1);
    expect(updateAvailabilityMock).toHaveBeenCalledTimes(1);
    expect(updateRestrictionsMock).toHaveBeenCalledTimes(1);
    expect(updateRatesMock.mock.calls[0][0].body).toMatchObject({ rate: 350 });
    expect(updateAvailabilityMock.mock.calls[0][0].body).toMatchObject({ count: 2 });
    expect(updateRestrictionsMock.mock.calls[0][0].body).toMatchObject({ minStay: 3 });
  });

  it("refuses to save with nothing to change", async () => {
    const user = userEvent.setup();
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    // Clear every field so nothing is set.
    await user.clear(screen.getByLabelText("Nightly rate (AUD)"));
    await user.clear(screen.getByLabelText("Bookable units"));
    await user.clear(screen.getByLabelText("Min stay (nights)"));
    await user.clear(screen.getByLabelText("Max stay (nights)"));

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText(/Change at least one field/i)).toBeInTheDocument();
    expect(updateRatesMock).not.toHaveBeenCalled();
    expect(updateRestrictionsMock).not.toHaveBeenCalled();
    expect(updateAvailabilityMock).not.toHaveBeenCalled();
  });

  it("validates max >= min stay", async () => {
    const user = userEvent.setup();
    render(withClient(<ListingCalendar listingId="L1" baseNightlyRate={285} />));
    const cells = screen.getAllByRole("button", { name: /bookable unit/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.clear(screen.getByLabelText("Min stay (nights)"));
    await user.type(screen.getByLabelText("Min stay (nights)"), "5");
    await user.clear(screen.getByLabelText("Max stay (nights)"));
    await user.type(screen.getByLabelText("Max stay (nights)"), "3");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText(/Max stay must be greater than or equal/i)).toBeInTheDocument();
    expect(updateRestrictionsMock).not.toHaveBeenCalled();
  });
});
