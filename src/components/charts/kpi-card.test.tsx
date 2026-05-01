import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KPICard } from "./kpi-card";
import type { KPIData } from "@/hooks/use-dashboard";

const baseKpi: Omit<KPIData, "trend"> = {
  label: "Total Revenue",
  value: 12345,
  icon: "dollar-sign",
  type: "currency",
};

function renderCard(trend: KPIData["trend"]) {
  return render(<KPICard kpi={{ ...baseKpi, trend }} onClick={vi.fn()} />);
}

describe("KPICard", () => {
  it("renders chip for a positive trend", () => {
    const { container } = renderCard(12.5);
    expect(container.textContent).toContain("12.5%");
  });

  it("renders chip for a negative trend", () => {
    const { container } = renderCard(-8.2);
    expect(container.textContent).toContain("8.2%");
  });

  it("renders no chip when trend is 0", () => {
    const { container } = renderCard(0);
    expect(container.textContent).not.toContain("%");
  });

  it("renders no chip when trend is null", () => {
    const { container } = renderCard(null);
    expect(container.textContent).not.toContain("%");
  });

  it("renders no chip when trend is undefined", () => {
    const { container } = renderCard(undefined);
    expect(container.textContent).not.toContain("%");
  });
});
