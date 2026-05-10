import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { kpisMock, chartsMock, storeMock } = vi.hoisted(() => ({
  kpisMock: vi.fn(),
  chartsMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-reporting", () => ({
  useReportingKPIs: (...args: unknown[]) => kpisMock(...args),
  useReportingChartData: (...args: unknown[]) => chartsMock(...args),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("./_components/reporting-kpi-row", () => ({
  ReportingKPIRow: ({ kpis }: { kpis: unknown[] }) => (
    <div data-testid="kpi-row">{kpis.length} kpis</div>
  ),
}));
vi.mock("./_components/reporting-chart-grid", () => ({
  ReportingChartGrid: () => <div data-testid="chart-grid" />,
}));
vi.mock("./_components/saved-reports-drawer", () => ({
  SavedReportsDrawer: () => <div data-testid="saved-reports-drawer" />,
}));

import ReportingPage from "./page";

const storeFor = (savedReportsOpen = false) => ({
  reporting: { submenu: [], windowSize: "month", anchor: null, savedReportsOpen },
  selectedListings: [],
});

describe("ReportingPage", () => {
  beforeEach(() => {
    kpisMock.mockReset();
    chartsMock.mockReset();
    storeMock.mockReset();
    storeMock.mockReturnValue(storeFor());
  });

  it("renders the loading skeleton while either query is loading", () => {
    kpisMock.mockReturnValue({ data: undefined, isLoading: true });
    chartsMock.mockReturnValue({ data: undefined, isLoading: false });
    render(<ReportingPage />);
    expect(screen.getByText(/loading reports/i)).toBeInTheDocument();
    expect(screen.queryByTestId("kpi-row")).not.toBeInTheDocument();
  });

  it("renders KPI row + chart grid once both queries succeed", () => {
    kpisMock.mockReturnValue({ data: [{ id: "k-1" }, { id: "k-2" }], isLoading: false });
    chartsMock.mockReturnValue({ data: { revenue: [] }, isLoading: false });
    render(<ReportingPage />);
    expect(screen.getByTestId("kpi-row")).toHaveTextContent("2 kpis");
    expect(screen.getByTestId("chart-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("saved-reports-drawer")).not.toBeInTheDocument();
  });

  it("falls back to an empty KPI row when the kpis array is missing", () => {
    kpisMock.mockReturnValue({ data: undefined, isLoading: false });
    chartsMock.mockReturnValue({ data: { revenue: [] }, isLoading: false });
    render(<ReportingPage />);
    expect(screen.getByTestId("kpi-row")).toHaveTextContent("0 kpis");
  });

  it("renders the saved reports drawer when savedReportsOpen is true", () => {
    storeMock.mockReturnValue(storeFor(true));
    kpisMock.mockReturnValue({ data: [], isLoading: false });
    chartsMock.mockReturnValue({ data: { revenue: [] }, isLoading: false });
    render(<ReportingPage />);
    expect(screen.getByTestId("saved-reports-drawer")).toBeInTheDocument();
  });
});
