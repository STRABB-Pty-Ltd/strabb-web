import { describe, expect, it } from "vitest";

import { PORTAL_TASK_STATUSES } from "@/lib/schemas/portal";

import { cleaningStatusColor, cleaningStatusColors } from "./cleaning-status";

// Guards the owner-side ops board: a cleaner can now drive a task into
// `accepted` and `in_progress`, so every status in the shared vocabulary must
// have an explicit colour or a cleaner-progressed clean renders as the
// unknown/fallback tone on the kanban.
describe("cleaningStatusColors completeness", () => {
  it("maps every cleaning status explicitly (no fallback)", () => {
    for (const status of PORTAL_TASK_STATUSES) {
      expect(cleaningStatusColors[status], `explicit colour for ${status}`).toMatch(/^var\(--/);
    }
  });

  it("gives accepted its own token, distinct from the unknown fallback", () => {
    expect(cleaningStatusColor("accepted")).toBe("var(--status-accepted)");
    expect(cleaningStatusColor("accepted")).not.toBe(cleaningStatusColor("some-unknown-status"));
  });
});
