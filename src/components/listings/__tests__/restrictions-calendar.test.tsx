import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useListingStateAPIMock = vi.fn();
const mutateAsyncMock = vi.fn();

vi.mock("@/lib/api-hooks/listing-state-api", () => ({
  useListingStateAPI: (...args: unknown[]) => useListingStateAPIMock(...args),
  useUpdateListingRestrictions: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ addToast: vi.fn() }),
}));

import { RestrictionsCalendar } from "../restrictions-calendar";

function withClient(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("RestrictionsCalendar", () => {
  beforeEach(() => {
    useListingStateAPIMock.mockReset();
    mutateAsyncMock.mockReset();
    useListingStateAPIMock.mockReturnValue({ data: [], isLoading: false });
  });

  it("renders weekday headers and the month label", () => {
    render(withClient(<RestrictionsCalendar listingId="L1" />));
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("queries the listing-state endpoint for the visible window", () => {
    render(withClient(<RestrictionsCalendar listingId="L1" />));
    expect(useListingStateAPIMock).toHaveBeenCalled();
    const [listingId, dateFrom, dateTo] = useListingStateAPIMock.mock.calls[0];
    expect(listingId).toBe("L1");
    expect(dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("renders no restriction badges when no override exists", () => {
    render(withClient(<RestrictionsCalendar listingId="L1" />));
    expect(screen.queryByText("CTA")).not.toBeInTheDocument();
    expect(screen.queryByText("CTD")).not.toBeInTheDocument();
    expect(screen.queryByText("STOP")).not.toBeInTheDocument();
  });

  it("opens the edit dialog from a single-cell selection", async () => {
    const user = userEvent.setup();
    render(withClient(<RestrictionsCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /^[A-Za-z]+ \d/ });
    expect(cells.length).toBeGreaterThan(0);
    await user.click(cells[0]);

    const editButton = screen.getByRole("button", { name: "Edit" });
    expect(editButton).toBeEnabled();
    await user.click(editButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Min stay/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max stay/i)).toBeInTheDocument();
  });

  it("blocks saving with no changes (at least one field required)", async () => {
    const user = userEvent.setup();
    render(withClient(<RestrictionsCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /^[A-Za-z]+ \d/ });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(
      within(screen.getByRole("dialog")).getByText(/at least one restriction/i),
    ).toBeInTheDocument();
  });

  it("submits only the fields the user changed (omits 'leave alone' booleans)", async () => {
    mutateAsyncMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(withClient(<RestrictionsCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /^[A-Za-z]+ \d/ });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.clear(screen.getByLabelText(/Min stay/i));
    await user.type(screen.getByLabelText(/Min stay/i), "3");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    const callArg = mutateAsyncMock.mock.calls[0][0];
    expect(callArg.listingId).toBe("L1");
    expect(callArg.body.minStay).toBe(3);
    // The booleans the user didn't touch must NOT be on the payload —
    // we don't want to clobber existing values on the backend.
    expect("closedToArrival" in callArg.body).toBe(false);
    expect("closedToDeparture" in callArg.body).toBe(false);
    expect("stopSell" in callArg.body).toBe(false);
    expect("maxStay" in callArg.body).toBe(false);
  });

  it("submits a range body when the user shift-extends the selection", async () => {
    mutateAsyncMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(withClient(<RestrictionsCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /^[A-Za-z]+ \d/ });
    await user.click(cells[0]);
    await user.keyboard("{Shift>}");
    await user.click(cells[5]);
    await user.keyboard("{/Shift}");

    expect(screen.getByRole("button", { name: "Edit range" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit range" }));

    // Select "Yes" for stop-sell.
    const stopSellGroup = within(screen.getByRole("group", { name: /Stop sell/i }));
    await user.click(stopSellGroup.getByLabelText("Yes"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const callArg = mutateAsyncMock.mock.calls[0][0];
    expect("dateFrom" in callArg.body).toBe(true);
    expect("dateTo" in callArg.body).toBe(true);
    expect(callArg.body.stopSell).toBe(true);
  });

  it("validates max_stay >= min_stay client-side before submitting", async () => {
    const user = userEvent.setup();
    render(withClient(<RestrictionsCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /^[A-Za-z]+ \d/ });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.clear(screen.getByLabelText(/Min stay/i));
    await user.type(screen.getByLabelText(/Min stay/i), "7");
    await user.clear(screen.getByLabelText(/Max stay/i));
    await user.type(screen.getByLabelText(/Max stay/i), "2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(within(screen.getByRole("dialog")).getByText(/Max stay.*greater/i)).toBeInTheDocument();
  });

  it("rejects min_stay out of range (must be 1-365)", async () => {
    const user = userEvent.setup();
    render(withClient(<RestrictionsCalendar listingId="L1" />));

    const cells = screen.getAllByRole("button", { name: /^[A-Za-z]+ \d/ });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.clear(screen.getByLabelText(/Min stay/i));
    await user.type(screen.getByLabelText(/Min stay/i), "0");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(within(screen.getByRole("dialog")).getByText(/Min stay.*1 to 365/i)).toBeInTheDocument();
  });

  it("renders CTA/CTD/STOP badges for cells with overrides", () => {
    // Force a date that's guaranteed to be in the visible window: pick
    // today, since the calendar opens to current month by default.
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    useListingStateAPIMock.mockReturnValue({
      data: [
        {
          date: isoToday,
          rate: null,
          minStay: 3,
          maxStay: null,
          closedToArrival: true,
          closedToDeparture: false,
          stopSell: true,
          availabilityCount: 1,
        },
      ],
      isLoading: false,
    });
    render(withClient(<RestrictionsCalendar listingId="L1" />));
    expect(screen.getByText("min 3")).toBeInTheDocument();
    expect(screen.getByText("CTA")).toBeInTheDocument();
    expect(screen.getByText("STOP")).toBeInTheDocument();
    expect(screen.queryByText("CTD")).not.toBeInTheDocument();
  });
});
