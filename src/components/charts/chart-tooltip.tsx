"use client";

import type { ComponentProps, CSSProperties } from "react";
import { Tooltip } from "recharts";

const FONT_SIZE = 13; // mirrors var(--text-body)

const baseContentStyle: CSSProperties = {
  fontSize: FONT_SIZE,
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--neutral-30)",
  borderRadius: 8,
  boxShadow: "var(--shadow-md)",
  padding: "8px 12px",
};

const themedTextStyle: CSSProperties = { color: "var(--popover-foreground)" };

type ChartTooltipProps = ComponentProps<typeof Tooltip>;

export function ChartTooltip(props: ChartTooltipProps) {
  const { contentStyle, labelStyle, itemStyle, ...rest } = props;
  return (
    <Tooltip
      {...rest}
      contentStyle={{ ...baseContentStyle, ...contentStyle }}
      labelStyle={{ ...themedTextStyle, ...labelStyle }}
      itemStyle={{ ...themedTextStyle, ...itemStyle }}
    />
  );
}
