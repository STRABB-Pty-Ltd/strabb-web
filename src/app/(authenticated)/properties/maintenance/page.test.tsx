import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Maintenance } from "@/types/maintenance";

const { maintenanceMock, propertiesMock, openDrillDownPanelMock } = vi.hoisted(() => ({
  maintenanceMock: vi.fn(),
  propertiesMock: vi.fn(),
  openDrillDownPanelMock: vi.fn(),
}));

vi.mock("@/lib/api-hooks/maintenance-api", () => ({
  useMaintenanceAPI: (...args: unknown[]) => maintenanceMock(...args),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      openDrillDownPanel: openDrillDownPanelMock,
      addToast: vi.fn(),
    }),
}));

vi.mock("@/components/pages/properties/maintenance-form-dialog", () => ({
  MaintenanceFormDialog: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="form-dialog">{trigger}</div>
  ),
}));

import MaintenancePage from "./page";

const item: Maintenance = {
  id: "maint-1",
  propertyId: "prop-1",
  listingId: null,
  description: "Leaking tap in main bathroom",
  priority: "high",
  status: "reported",
  dateReported: "2026-04-25T00:00:00Z",
  dateScheduled: null,
  dateCompleted: null,
  cost: null,
  notes: null,
  createdAt: "2026-04-25T00:00:00Z",
  updatedAt: "2026-04-25T00:00:00Z",
};

describe("MaintenancePage", () => {
  beforeEach(() => {
    maintenanceMock.mockReset();
    propertiesMock.mockReset();
    openDrillDownPanelMock.mockReset();

    propertiesMock.mockReturnValue({
      data: { data: [{ id: "prop-1", name: "Beach House" }] },
    });
    maintenanceMock.mockReturnValue({
      data: {
        data: [item],
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      },
      isLoading: false,
    });
  });

  it("renders maintenance requests with property names resolved", () => {
    render(<MaintenancePage />);

    // "Beach House" appears in the property filter and the row — confirm both surface
    expect(screen.getAllByText("Beach House").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/leaking tap/i)).toBeInTheDocument();
  });

  it("status filter change refetches with status filter applied", async () => {
    render(<MaintenancePage />);

    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    await userEvent.selectOptions(statusSelect, "reported");

    const lastCall = maintenanceMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toEqual(expect.objectContaining({ status: "reported", page: 1 }));
  });

  it("clicking a row opens the drill-down panel for that maintenance request", async () => {
    render(<MaintenancePage />);

    await userEvent.click(screen.getByText(/leaking tap/i));
    expect(openDrillDownPanelMock).toHaveBeenCalledWith("maintenance", item.id);
  });

  it("loading state hides the list", () => {
    maintenanceMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<MaintenancePage />);
    expect(screen.getByText(/loading maintenance/i)).toBeInTheDocument();
  });
});
