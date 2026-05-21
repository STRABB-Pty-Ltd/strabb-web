import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const useListingStateAPIMock = vi.fn();
const mutateAsyncMock = vi.fn();

vi.mock("@/lib/api-hooks/listing-state-api", () => ({
  useListingStateAPI: (...args: unknown[]) => useListingStateAPIMock(...args),
  useUpdateListingRates: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ addToast: vi.fn() }),
}));

import { RatesCalendar } from "../rates-calendar";

function withClient(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("RatesCalendar", () => {
  beforeEach(() => {
    useListingStateAPIMock.mockReset();
    mutateAsyncMock.mockReset();
    useListingStateAPIMock.mockReturnValue({ data: [], isLoading: false });
  });

  it("renders the month label and weekday headers", () => {
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));
    // Weekday headers are present.
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("queries the listing-state endpoint with the visible window", () => {
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));
    // Called with (listingId, dateFromIso, dateToIso, enabled).
    expect(useListingStateAPIMock).toHaveBeenCalled();
    const [listingId, dateFrom, dateTo] = useListingStateAPIMock.mock.calls[0];
    expect(listingId).toBe("L1");
    expect(dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shows the base nightly rate when no override exists", () => {
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));
    // At least one cell renders the formatted base rate.
    const cells = screen.getAllByText(/\$285\.00/);
    expect(cells.length).toBeGreaterThan(0);
  });

  it("shows '—' when no override and no base rate", () => {
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={null} />));
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("opens the edit dialog after selecting a cell and clicking Edit", async () => {
    const user = userEvent.setup();
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));

    // Pick the first selectable day cell (button with aria-pressed).
    const cells = screen.getAllByRole("button", { name: /rate/i });
    expect(cells.length).toBeGreaterThan(0);
    await user.click(cells[0]);

    // Edit button enables; click it to open the dialog.
    const editButton = screen.getByRole("button", { name: "Edit" });
    expect(editButton).toBeEnabled();
    await user.click(editButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nightly rate/i)).toBeInTheDocument();
  });

  it("submits a single-date PATCH when saving from a single-cell selection", async () => {
    mutateAsyncMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));

    const cells = screen.getAllByRole("button", { name: /rate/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByLabelText(/Nightly rate/i) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "320.50");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    const callArg = mutateAsyncMock.mock.calls[0][0];
    expect(callArg.listingId).toBe("L1");
    expect(callArg.body.rate).toBe(320.5);
    // Single-cell selection ⇒ `date` shape, not `dateFrom`/`dateTo`.
    expect("date" in callArg.body).toBe(true);
    expect("dateFrom" in callArg.body).toBe(false);
  });

  it("submits a range PATCH when saving from a shift-extended selection", async () => {
    mutateAsyncMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));

    const cells = screen.getAllByRole("button", { name: /rate/i });
    await user.click(cells[0]);
    // Shift-click a later cell.
    await user.keyboard("{Shift>}");
    await user.click(cells[5]);
    await user.keyboard("{/Shift}");

    expect(screen.getByRole("button", { name: "Edit range" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit range" }));

    const input = screen.getByLabelText(/Nightly rate/i) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "299");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const callArg = mutateAsyncMock.mock.calls[0][0];
    expect("dateFrom" in callArg.body).toBe(true);
    expect("dateTo" in callArg.body).toBe(true);
    expect(callArg.body.rate).toBe(299);
  });

  it("rejects negative rates with an inline error and does not call the mutation", async () => {
    const user = userEvent.setup();
    render(withClient(<RatesCalendar listingId="L1" baseNightlyRate={285} />));

    const cells = screen.getAllByRole("button", { name: /rate/i });
    await user.click(cells[0]);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByLabelText(/Nightly rate/i);
    await user.clear(input);
    await user.type(input, "-10");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    // Inline error appears in the dialog.
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/non-negative/i)).toBeInTheDocument();
  });
});
