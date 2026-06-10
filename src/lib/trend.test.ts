import { describe, expect, it } from "vitest";

import { TREND_FLAT_THRESHOLD, trendDirection } from "./trend";

describe("trendDirection", () => {
  it("reads moves beyond +5% as trending up", () => {
    expect(trendDirection(100, 106)).toBe("trending up");
  });

  it("reads moves beyond -5% as trending down", () => {
    expect(trendDirection(100, 94)).toBe("trending down");
  });

  it("reads moves within the threshold as broadly flat, boundaries inclusive", () => {
    expect(trendDirection(100, 105)).toBe("broadly flat");
    expect(trendDirection(100, 95)).toBe("broadly flat");
    expect(trendDirection(100, 100)).toBe("broadly flat");
  });

  it("treats any growth from a zero baseline as trending up", () => {
    expect(trendDirection(0, 1)).toBe("trending up");
    expect(trendDirection(0, 0)).toBe("broadly flat");
  });

  it("exposes the threshold as a single shared constant", () => {
    expect(TREND_FLAT_THRESHOLD).toBe(0.05);
  });
});
