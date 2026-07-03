import { describe, expect, it } from "vitest";

import {
  formatTriggerLabel,
  MESSAGE_TEMPLATE_PREVIEW_VALUES,
  messageTemplateFormSchema,
  renderTemplatePreview,
} from "./message";

describe("renderTemplatePreview", () => {
  it("substitutes every known token with its sample value", () => {
    const out = renderTemplatePreview("Hi {guest_name}, welcome to {property_name}.");
    expect(out).toBe("Hi Sarah Chen, welcome to The Vale, Toowoomba.");
    expect(out).not.toContain("{");
  });

  it("leaves an unknown token visibly raw (typo cue)", () => {
    const out = renderTemplatePreview("Hi {guest_nme}, check in {check_in_date}.");
    // Known token substituted, typo left raw so the author sees it won't resolve.
    expect(out).toBe(`Hi {guest_nme}, check in ${MESSAGE_TEMPLATE_PREVIEW_VALUES.check_in_date}.`);
    expect(out).toContain("{guest_nme}");
  });

  it("supports a custom value map", () => {
    expect(renderTemplatePreview("{guest_name}", { guest_name: "Ada" })).toBe("Ada");
  });
});

describe("formatTriggerLabel", () => {
  it("describes on_confirmation", () => {
    expect(formatTriggerLabel("on_confirmation", null)).toBe("On booking confirmation");
  });

  it("describes days_before_checkin with plural handling", () => {
    expect(formatTriggerLabel("days_before_checkin", 1)).toBe("1 day before check-in");
    expect(formatTriggerLabel("days_before_checkin", 3)).toBe("3 days before check-in");
  });
});

describe("messageTemplateFormSchema", () => {
  const base = {
    templateKey: "pre_arrival_reminder",
    propertyId: "",
    subjectTemplate: "Your stay",
    bodyTemplate: "Hi {guest_name}",
    isActive: true,
  };

  it("accepts on_confirmation with an empty trigger_days", () => {
    const result = messageTemplateFormSchema.safeParse({
      ...base,
      triggerType: "on_confirmation",
      triggerDays: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts days_before_checkin with a whole day >= 1", () => {
    const result = messageTemplateFormSchema.safeParse({
      ...base,
      triggerType: "days_before_checkin",
      triggerDays: "2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects days_before_checkin with 0, empty, or non-integer days (422-equivalent)", () => {
    for (const triggerDays of ["0", "", "1.5", "abc"]) {
      const result = messageTemplateFormSchema.safeParse({
        ...base,
        triggerType: "days_before_checkin",
        triggerDays,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("triggerDays"))).toBe(true);
      }
    }
  });

  it("rejects an unknown trigger_type", () => {
    const result = messageTemplateFormSchema.safeParse({
      ...base,
      triggerType: "on_cancellation",
      triggerDays: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty subject or body", () => {
    expect(
      messageTemplateFormSchema.safeParse({
        ...base,
        subjectTemplate: "",
        triggerType: "on_confirmation",
        triggerDays: "",
      }).success,
    ).toBe(false);
  });
});
