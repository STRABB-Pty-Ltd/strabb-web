import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { kpisMock, alertsMock, previewMock, storeMock } = vi.hoisted(() => ({
  kpisMock: vi.fn(),
  alertsMock: vi.fn(),
  previewMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-dashboard", () => ({
  useDashboardKPIs: (...args: unknown[]) => kpisMock(...args),
  useDashboardAlerts: (...args: unknown[]) => alertsMock(...args),
  useDashboardPreview: (...args: unknown[]) => previewMock(...args),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("./_components/alert-strip", () => ({
  AlertStrip: ({ alerts }: { alerts: { id: string }[] }) => (
    <div data-testid="alert-strip">{alerts.length} alerts</div>
  ),
}));
vi.mock("./_components/compare-panel", () => ({
  ComparePanel: () => <div data-testid="compare-panel" />,
}));
vi.mock("./_components/kpi-grid", () => ({
  KPIGrid: ({ kpis }: { kpis: unknown }) => (
    <div data-testid="kpi-grid">{kpis ? "kpis" : "no kpis"}</div>
  ),
}));
vi.mock("./_components/preview-grid", () => ({
  PreviewGrid: () => <div data-testid="preview-grid" />,
}));

import DashboardPage from "./page";

const baseStore = {
  dashboard: { windowSize: "month", anchor: null, submenu: [], compare: false },
  selectedListings: [],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    kpisMock.mockReset();
    alertsMock.mockReset();
    previewMock.mockReset();
    storeMock.mockReset();
    storeMock.mockReturnValue(baseStore);
  });

  it("renders the loading skeleton while KPI or preview is loading", () => {
    kpisMock.mockReturnValue({ data: undefined, isLoading: true });
    alertsMock.mockReturnValue({ data: [] });
    previewMock.mockReturnValue({ data: undefined, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    expect(screen.queryByTestId("kpi-grid")).not.toBeInTheDocument();
  });

  it("renders KPI grid + preview grid once both queries succeed", () => {
    kpisMock.mockReturnValue({ data: { revenue: 0 }, isLoading: false });
    alertsMock.mockReturnValue({ data: [] });
    previewMock.mockReturnValue({ data: { miniCalendar: [] }, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByTestId("kpi-grid")).toHaveTextContent("kpis");
    expect(screen.getByTestId("preview-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("compare-panel")).not.toBeInTheDocument();
  });

  it("renders AlertStrip when alerts are present", () => {
    kpisMock.mockReturnValue({ data: { revenue: 0 }, isLoading: false });
    alertsMock.mockReturnValue({ data: [{ id: "a1" }, { id: "a2" }] });
    previewMock.mockReturnValue({ data: { miniCalendar: [] }, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByTestId("alert-strip")).toHaveTextContent("2 alerts");
  });

  it("renders the compare panel when dashboard.compare is true", () => {
    storeMock.mockReturnValue({
      ...baseStore,
      dashboard: { ...baseStore.dashboard, compare: true },
    });
    kpisMock.mockReturnValue({ data: { revenue: 0 }, isLoading: false });
    alertsMock.mockReturnValue({ data: [] });
    previewMock.mockReturnValue({ data: { miniCalendar: [] }, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByTestId("compare-panel")).toBeInTheDocument();
  });
});
