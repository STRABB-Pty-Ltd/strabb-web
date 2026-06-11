import { occupancyRateToPercent } from "@/lib/percent";

// Shared payload types + card builder for /dashboard/kpis and
// /reporting/kpis. Both endpoints return the api's DashboardKPIs schema
// (one MetricsService definition server-side), so the web describes the
// shape once and each surface only declares which cards it shows.

export interface RawKPIValues {
  revenue: number;
  expenses: number;
  netIncome: number;
  // Decimal 0..1 from the api (4 dp = 2 dp as a percent).
  occupancyRate: number;
  avgNightlyRate: number;
  totalBookings: number;
  currency?: string;
}

// Per-KPI period-over-period deltas. null = no prior-period data (renders
// no arrow); a real 0 is a genuinely flat period (renders a flat chip).
export interface RawKPITrends {
  revenue: number | null;
  expenses: number | null;
  netIncome: number | null;
  occupancyRate: number | null;
  avgNightlyRate: number | null;
  totalBookings: number | null;
}

// The server also returns a `previous` block, but the web reads only the
// current values + trends, so the report type carries just those.
export interface RawKPIReport extends RawKPIValues {
  trends: RawKPITrends;
}

export interface KPICardData {
  label: string;
  value: number;
  icon: string;
  trend: number | null;
  type: "currency" | "number" | "percentage";
}

type KPIField = keyof RawKPITrends;

export interface KPICardSpec {
  label: string;
  icon: string;
  type: KPICardData["type"];
  field: KPIField;
}

export function buildKPICards(raw: RawKPIReport, specs: readonly KPICardSpec[]): KPICardData[] {
  const t = raw.trends;
  return specs.map((spec) => ({
    label: spec.label,
    icon: spec.icon,
    type: spec.type,
    // A percentage card arrives as a 0..1 decimal; every other field displays
    // as-is (money is already rounded to 2 dp by the api). Gating on the card
    // type, not the field name, keeps a future percentage card correct.
    value:
      spec.type === "percentage" ? occupancyRateToPercent(raw[spec.field]) : raw[spec.field],
    // `?? null` maps a defensively-absent trends object to no-arrow while
    // keeping a real 0% delta.
    trend: t?.[spec.field] ?? null,
  }));
}

// The dashboard shows 4 of the 6 KPI cards.
export const DASHBOARD_KPI_CARDS: readonly KPICardSpec[] = [
  { label: "Total Revenue", icon: "dollar-sign", type: "currency", field: "revenue" },
  { label: "Net Income", icon: "trending-up", type: "currency", field: "netIncome" },
  { label: "Avg Occupancy", icon: "percent", type: "percentage", field: "occupancyRate" },
  { label: "Avg $/night", icon: "bed", type: "currency", field: "avgNightlyRate" },
];

// Reporting shows all six.
export const REPORTING_KPI_CARDS: readonly KPICardSpec[] = [
  { label: "Total Revenue", icon: "dollar-sign", type: "currency", field: "revenue" },
  { label: "Net Income", icon: "trending-up", type: "currency", field: "netIncome" },
  { label: "Total Expenses", icon: "receipt", type: "currency", field: "expenses" },
  { label: "Avg Occupancy", icon: "percent", type: "percentage", field: "occupancyRate" },
  { label: "Avg $/night", icon: "bed", type: "currency", field: "avgNightlyRate" },
  { label: "Total Bookings", icon: "calendar", type: "number", field: "totalBookings" },
];
