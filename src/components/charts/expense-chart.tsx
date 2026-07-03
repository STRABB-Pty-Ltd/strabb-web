"use client";

import { Cell, Legend, Pie, PieChart } from "recharts";

import { ChartContainer } from "./chart-container";
import { ChartTooltip } from "./chart-tooltip";

interface ExpenseData {
  category: string;
  amount: number;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  loading?: boolean;
}

// Phase D adds up to eight expense categories (rent, utilities, insurance,
// subscriptions, supplies, maintenance, wages_other, other) plus the derived
// cleaning row, so the palette must carry enough distinct, both-theme-safe
// tokens to avoid two adjacent slices sharing a colour. The index still wraps
// (expenseSliceColor), so any overflow beyond the palette cycles rather than
// crashing.
export const EXPENSE_CHART_COLORS = [
  "var(--highlight-10)",
  "var(--channel-direct)",
  "var(--status-success)",
  "var(--status-danger)",
  "var(--status-warning)",
  "var(--channel-airbnb)",
  "var(--channel-booking)",
  "var(--channel-vrbo)",
];

// Colour for the nth pie slice, cycling the palette so more categories than
// colours never throw and the first EXPENSE_CHART_COLORS.length are distinct.
export function expenseSliceColor(index: number): string {
  return EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length];
}

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

function buildSummary(data: ExpenseData[]): string {
  if (data.length === 0) return "";
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const largest = sorted[0];
  const smallest = sorted[sorted.length - 1];
  return (
    `Expense breakdown across ${data.length} categories totalling ${formatAUD(total)}. ` +
    `Largest is ${largest.category} at ${formatAUD(largest.amount)}, ` +
    `smallest is ${smallest.category} at ${formatAUD(smallest.amount)}.`
  );
}

export function ExpenseChart({ data, loading }: ExpenseChartProps) {
  return (
    <ChartContainer
      title="Expense Breakdown"
      summary={buildSummary(data)}
      loading={loading}
      empty={data.length === 0}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          // 55 = --space-xl, 89 is on the Fibonacci ladder
          innerRadius={55}
          outerRadius={89}
          paddingAngle={2}
          label={({ name, value }) => `${name}: ${formatAUD(Number(value))}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={expenseSliceColor(i)} />
          ))}
        </Pie>
        <ChartTooltip formatter={(value) => formatAUD(Number(value))} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(v) => <span className="text-body">{v}</span>}
        />
      </PieChart>
    </ChartContainer>
  );
}
