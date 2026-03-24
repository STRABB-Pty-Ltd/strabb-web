import { describe, expect, it } from "vitest";

import { formatDateInTimezone, formatInPropertyTimezone, getTimezoneAbbr } from "./date-utils";

describe("formatInPropertyTimezone", () => {
  it("converts UTC to Sydney time", () => {
    // 2024-03-15 14:00 UTC = 2024-03-16 01:00 AEDT (Sydney is UTC+11 during DST)
    const result = formatInPropertyTimezone("2024-03-15T14:00:00Z", "Australia/Sydney");
    expect(result).toContain("16 Mar 2024");
    expect(result).toContain("1:00");
  });

  it("converts UTC to Perth time (no DST)", () => {
    // 2024-03-15 14:00 UTC = 2024-03-15 22:00 AWST (Perth is UTC+8)
    const result = formatInPropertyTimezone("2024-03-15T14:00:00Z", "Australia/Perth");
    expect(result).toContain("15 Mar 2024");
    expect(result).toContain("10:00");
  });

  it("uses custom format string", () => {
    const result = formatInPropertyTimezone(
      "2024-03-15T14:00:00Z",
      "Australia/Sydney",
      "yyyy-MM-dd",
    );
    expect(result).toBe("2024-03-16");
  });
});

describe("formatDateInTimezone", () => {
  it("returns date only", () => {
    const result = formatDateInTimezone("2024-03-15T14:00:00Z", "Australia/Sydney");
    expect(result).toBe("16 Mar 2024");
  });
});

describe("getTimezoneAbbr", () => {
  it("returns timezone abbreviation", () => {
    const result = getTimezoneAbbr("2024-03-15T14:00:00Z", "Australia/Sydney");
    // March = AEDT (daylight saving)
    expect(result).toMatch(/AE[SD]T/);
  });

  it("returns Perth timezone", () => {
    const result = getTimezoneAbbr("2024-03-15T14:00:00Z", "Australia/Perth");
    expect(result).toMatch(/AWST/);
  });
});
