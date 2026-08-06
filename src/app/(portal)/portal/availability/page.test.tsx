import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AvailabilityResponse } from "@/lib/schemas/portal";

const useAvailabilityMock = vi.fn();
const useUpdateWeeklyAvailabilityMock = vi.fn();
const useAddTimeOffMock = vi.fn();
const useDeleteTimeOffMock = vi.fn();
const updateWeeklyMutate = vi.fn();
const addToastMock = vi.fn();

vi.mock("@/lib/api-hooks/portal-api", () => ({
  useAvailability: () => useAvailabilityMock(),
  useUpdateWeeklyAvailability: () => useUpdateWeeklyAvailabilityMock(),
  useAddTimeOff: () => useAddTimeOffMock(),
  useDeleteTimeOff: () => useDeleteTimeOffMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import PortalAvailabilityPage from "./page";

function availability(overrides: Partial<AvailabilityResponse> = {}): AvailabilityResponse {
  return {
    // Monday 09:00-17:00, as the api returns it (seconds present, camelCased).
    weekly: [{ id: "w1", weekday: 0, startTime: "09:00:00", endTime: "17:00:00" }],
    timeOff: [],
    ...overrides,
  };
}

describe("PortalAvailabilityPage", () => {
  beforeEach(() => {
    useAvailabilityMock.mockReset().mockReturnValue({ data: availability(), isLoading: false });
    updateWeeklyMutate.mockReset();
    useUpdateWeeklyAvailabilityMock
      .mockReset()
      .mockReturnValue({ mutate: updateWeeklyMutate, isPending: false });
    useAddTimeOffMock.mockReset().mockReturnValue({ mutate: vi.fn(), isPending: false });
    useDeleteTimeOffMock.mockReset().mockReturnValue({ mutate: vi.fn(), isPending: false });
    addToastMock.mockReset();
  });

  it("seeds the weekly inputs from the GET so saved data shows after a refresh", () => {
    render(<PortalAvailabilityPage />);
    const start = screen.getByLabelText(/monday start/i) as HTMLInputElement;
    const end = screen.getByLabelText(/monday end/i) as HTMLInputElement;
    // Seeded from the fetched slot, trimmed to HH:MM for the time input.
    expect(start.value).toBe("09:00");
    expect(end.value).toBe("17:00");
  });

  it("saves the weekly set as a bare array (not wrapped)", async () => {
    render(<PortalAvailabilityPage />);
    await userEvent.click(screen.getByRole("button", { name: /save weekly hours/i }));

    expect(updateWeeklyMutate).toHaveBeenCalledTimes(1);
    const [payload] = updateWeeklyMutate.mock.calls[0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toEqual([{ id: "w1", weekday: 0, startTime: "09:00", endTime: "17:00" }]);
  });
});
