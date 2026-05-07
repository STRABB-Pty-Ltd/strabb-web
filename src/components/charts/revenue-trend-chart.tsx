"use client";

import { format, parse } from "date-fns";
import { Area, AreaChart, CartesianGrid, Customized, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";
import { ChartTooltip } from "./chart-tooltip";

// Recharts forwards numeric font sizes to internal SVG <text> elements and uses
// getComputedStyle for measurement, so a `var(--text-body)` string is unsafe in
// these props. Mirror the token here as a plain number to keep the link
// documented while staying compatible.
const FONT_SIZE = 13; // mirrors var(--text-body)

interface RevenueTrendData {
  label: string;
  revenue: number;
  bookings?: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  loading?: boolean;
}

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

export function formatMonthLabel(value: string): string {
  const parsed = parse(value, "yyyy-MM", new Date());
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "MMM yyyy");
}

function formatMonthOnly(value: string): string {
  const parsed = parse(value, "yyyy-MM", new Date());
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "MMM");
}

export function groupByYear(labels: string[]): { year: string; labels: string[] }[] {
  const map = new Map<string, string[]>();
  for (const label of labels) {
    const year = label.slice(0, 4);
    const list = map.get(year) ?? [];
    list.push(label);
    map.set(year, list);
  }
  return [...map.entries()].map(([year, list]) => ({ year, labels: list }));
}

interface YearBracketsProps {
  data: RevenueTrendData[];
}

// Renders a year band beneath the month axis: a subtle bracket line spanning
// each year's months with the year centered below.
function YearBrackets(props: YearBracketsProps & Record<string, unknown>) {
  const { data } = props;
  const xAxisMap = props.xAxisMap as Record<string, { scale?: (v: string) => number }> | undefined;
  const offset = props.offset as { top?: number; height?: number } | undefined;
  if (!xAxisMap || !offset) return null;
  const xAxis = Object.values(xAxisMap)[0];
  const scale = xAxis?.scale;
  if (!scale) return null;

  const top = (offset.top ?? 0) + (offset.height ?? 0);
  const bracketY = top + 30;
  const textY = bracketY + 14;

  return (
    <g>
      {groupByYear(data.map((d) => d.label)).map(({ year, labels }) => {
        const firstX = scale(labels[0]);
        const lastX = scale(labels[labels.length - 1]);
        if (firstX == null || lastX == null) return null;
        const midX = (firstX + lastX) / 2;
        return (
          <g key={year}>
            <line
              x1={firstX}
              x2={lastX}
              y1={bracketY}
              y2={bracketY}
              stroke="var(--highlight-10)"
              strokeOpacity={0.35}
            />
            <line
              x1={firstX}
              x2={firstX}
              y1={bracketY}
              y2={bracketY - 4}
              stroke="var(--highlight-10)"
              strokeOpacity={0.35}
            />
            <line
              x1={lastX}
              x2={lastX}
              y1={bracketY}
              y2={bracketY - 4}
              stroke="var(--highlight-10)"
              strokeOpacity={0.35}
            />
            <text
              x={midX}
              y={textY}
              textAnchor="middle"
              fill="var(--highlight-10)"
              fontSize={FONT_SIZE}
            >
              {year}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  return (
    <ChartContainer title="Revenue Trend" loading={loading} empty={data.length === 0}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 28 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--highlight-10)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--highlight-10)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: FONT_SIZE, fill: "var(--highlight-10)" }}
          tickFormatter={formatMonthOnly}
        />
        <YAxis
          tick={{ fontSize: FONT_SIZE, fill: "var(--highlight-10)" }}
          tickFormatter={formatAUD}
        />
        <ChartTooltip
          formatter={(value) => [formatAUD(Number(value)), "Revenue"]}
          labelFormatter={(label) => formatMonthLabel(String(label))}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--highlight-10)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
        <Customized component={<YearBrackets data={data} />} />
      </AreaChart>
    </ChartContainer>
  );
}
