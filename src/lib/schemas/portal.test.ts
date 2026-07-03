import { describe, expect, it } from "vitest";

import {
  nextActionForStatus,
  PORTAL_STATUS_COLORS,
  PORTAL_STATUS_LABELS,
  PORTAL_TASK_STATUSES,
  TRANSITION_TARGET_STATUS,
  type PortalTaskStatus,
} from "./portal";

describe("portal status maps", () => {
  it("labels and colours cover every portal status (no missing chip)", () => {
    for (const status of PORTAL_TASK_STATUSES) {
      expect(PORTAL_STATUS_LABELS[status], `label for ${status}`).toBeTruthy();
      expect(PORTAL_STATUS_COLORS[status], `colour for ${status}`).toMatch(/^var\(--/);
    }
    // The label/colour maps must not carry stray keys the status set doesn't.
    expect(Object.keys(PORTAL_STATUS_LABELS).sort()).toEqual([...PORTAL_TASK_STATUSES].sort());
    expect(Object.keys(PORTAL_STATUS_COLORS).sort()).toEqual([...PORTAL_TASK_STATUSES].sort());
  });

  it("includes the two Phase D statuses", () => {
    expect(PORTAL_TASK_STATUSES).toContain("accepted");
    expect(PORTAL_TASK_STATUSES).toContain("in_progress");
  });
});

describe("nextActionForStatus", () => {
  const cases: [PortalTaskStatus, ReturnType<typeof nextActionForStatus>][] = [
    ["pending", "accept"],
    ["confirmed", "accept"],
    ["accepted", "start"],
    ["in_progress", "complete"],
    ["completed", null],
    ["cancelled", null],
  ];

  it.each(cases)("maps %s to %s", (status, expected) => {
    expect(nextActionForStatus(status)).toBe(expected);
  });
});

describe("TRANSITION_TARGET_STATUS", () => {
  it("advances the status the optimistic write should show", () => {
    expect(TRANSITION_TARGET_STATUS.accept).toBe("accepted");
    expect(TRANSITION_TARGET_STATUS.start).toBe("in_progress");
    expect(TRANSITION_TARGET_STATUS.complete).toBe("completed");
  });
});
