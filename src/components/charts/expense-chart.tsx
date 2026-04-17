"use client";

import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

import { ChartContainer } from "./chart-container";

interface ExpenseData {
  category: string;
  amount: number;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  loading?: boolean;
}

const COLORS = ["#1E1E85", "#6B7280", "#16A34A", "#DC2626"];

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

export function ExpenseChart({ data, loading }: ExpenseChartProps) {
  return (
    <ChartContainer title="Expense Breakdown" loading={loading} empty={data.length === 0}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={89}
          paddingAngle={2}
          label={({ name, value }) => `${name}: ${formatAUD(Number(value))}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatAUD(Number(value))} contentStyle={{ fontSize: 13 }} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(v) => <span className="text-body">{v}</span>}
        />
      </PieChart>
    </ChartContainer>
  );
}
