import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Maintenance } from "@/types/maintenance";

const {
  addToastMock,
  closeDrillDownPanelMock,
  maintenanceMock,
  propertiesMock,
  updateMutate,
  deleteMutate,
} = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  closeDrillDownPanelMock: vi.fn(),
  maintenanceMock: vi.fn(),
  propertiesMock: vi.fn(),
  updateMutate: vi.fn(),
  deleteMutate: vi.fn(),
}));

const storeState = {
  drillDownPanel: null as { open: boolean; type: string; itemId: string } | null,
  closeDrillDownPanel: closeDrillDownPanelMock,
  addToast: addToastMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock("@/lib/api-hooks/maintenance-api", () => ({
  useMaintenance: () => maintenanceMock(),
  useUpdateMaintenanceAPI: () => ({ mutate: updateMutate, isPending: false }),
  useDeleteMaintenanceAPI: () => ({ mutate: deleteMutate, isPending: false }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

import { MaintenanceDetailDrawer } from "./maintenance-detail-drawer";

const baseRequest: Maintenance = {
  id: "maint-1",
  propertyId: "prop-1",
  listingId: null,
  description: "Leaking tap",
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

describe("MaintenanceDetailDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    closeDrillDownPanelMock.mockReset();
    maintenanceMock.mockReset();
    propertiesMock.mockReset();
    updateMutate.mockReset();
    deleteMutate.mockReset();

    propertiesMock.mockReturnValue({
      data: { data: [{ id: "prop-1", name: "Beach House" }] },
    });
    storeState.drillDownPanel = null;
  });

  it("renders nothing when drill-down is not maintenance", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: "x" };
    maintenanceMock.mockReturnValue({ data: null, isLoading: false });
    const { container } = render(<MaintenanceDetailDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders maintenance detail with property name resolved", () => {
    storeState.drillDownPanel = { open: true, type: "maintenance", itemId: baseRequest.id };
    maintenanceMock.mockReturnValue({ data: baseRequest, isLoading: false });
    render(<MaintenanceDetailDrawer />);

    expect(screen.getByText("Beach House")).toBeInTheDocument();
    expect(screen.getByText("Leaking tap")).toBeInTheDocument();
  });

  it("Edit toggles edit mode and Save fires update mutation", async () => {
    storeState.drillDownPanel = { open: true, type: "maintenance", itemId: baseRequest.id };
    maintenanceMock.mockReturnValue({ data: baseRequest, isLoading: false });
    render(<MaintenanceDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseRequest.id,
        data: expect.objectContaining({ description: "Leaking tap", priority: "high" }),
      }),
      expect.any(Object),
    );
  });

  it("Delete requires confirmation then calls delete mutation", async () => {
    storeState.drillDownPanel = { open: true, type: "maintenance", itemId: baseRequest.id };
    maintenanceMock.mockReturnValue({ data: baseRequest, isLoading: false });
    render(<MaintenanceDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(deleteMutate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(deleteMutate).toHaveBeenCalledWith(baseRequest.id, expect.any(Object));
  });
});
