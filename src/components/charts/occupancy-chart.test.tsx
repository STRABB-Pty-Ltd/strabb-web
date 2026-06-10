import { describe, expect, it } from "vitest";

import { buildSummary, type OccupancyData } from "./occupancy-chart";

const JUNE: OccupancyData[] = [
  { listing: "Bannockburn Cottage", occupancy: 69, bookedDays: 20, availableDays: 29 },
  { listing: "Bannockburn Estate", occupancy: 25, bookedDays: 5, availableDays: 20 },
  { listing: "Bannockburn Lodge", occupancy: 68, bookedDays: 19, availableDays: 28 },
];

describe("buildSummary", () => {
  it("reports the weighted aggregate, not an unweighted mean of listing rates", () => {
    // Unweighted mean of 69/25/68 is 54; the true aggregate is 44/77 = 57.
    expect(buildSummary(JUNE)).toContain("averaging 57 percent");
  });

  it("names the highest and lowest listings", () => {
    const summary = buildSummary(JUNE);
    expect(summary).toContain("Highest is Bannockburn Cottage at 69 percent");
    expect(summary).toContain("lowest is Bannockburn Estate at 25 percent");
  });

  it("returns an empty string for no data", () => {
    expect(buildSummary([])).toBe("");
  });

  it("averages 0 when there are no sellable nights", () => {
    const data: OccupancyData[] = [{ listing: "A", occupancy: 0, bookedDays: 0, availableDays: 0 }];
    expect(buildSummary(data)).toContain("averaging 0 percent");
  });
});
