import { describe, expect, it } from "vitest";

import { propertyCreateSchema, propertyUpdateSchema } from "./property";

describe("propertyCreateSchema", () => {
  it("parses a valid payload", () => {
    const result = propertyCreateSchema.parse({
      name: "Beach House",
      address: "1 Ocean Rd",
      timezone: "Australia/Sydney",
      cleaningDurationMinutes: 90,
      accessInstructions: "Lockbox 1234",
      notes: "Pet friendly",
      cleanerName: "Jane",
      cleanerEmail: "jane@example.com",
      cleanerPhone: "+61400000000",
    });
    expect(result.name).toBe("Beach House");
    expect(result.cleaningDurationMinutes).toBe(90);
  });

  it("applies the cleaningDurationMinutes default of 120", () => {
    const result = propertyCreateSchema.parse({
      name: "Beach House",
      timezone: "Australia/Sydney",
    });
    expect(result.cleaningDurationMinutes).toBe(120);
  });

  it("fails when name is missing", () => {
    const result = propertyCreateSchema.safeParse({ timezone: "Australia/Sydney" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue).toBeDefined();
    }
  });

  it("fails when name is an empty string", () => {
    const result = propertyCreateSchema.safeParse({ name: "", timezone: "Australia/Sydney" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue?.message).toBe("Name is required");
    }
  });

  it("fails when name exceeds 255 characters", () => {
    const result = propertyCreateSchema.safeParse({
      name: "a".repeat(256),
      timezone: "Australia/Sydney",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue).toBeDefined();
    }
  });

  it("fails when timezone is missing", () => {
    const result = propertyCreateSchema.safeParse({ name: "Beach House" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "timezone");
      expect(issue).toBeDefined();
    }
  });

  it("fails when timezone is an empty string with the custom message", () => {
    const result = propertyCreateSchema.safeParse({ name: "Beach House", timezone: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "timezone");
      expect(issue?.message).toBe("Timezone is required");
    }
  });

  it("fails when timezone is not a valid IANA name", () => {
    const result = propertyCreateSchema.safeParse({
      name: "Beach House",
      timezone: "Not/AReal_Zone",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "timezone");
      expect(issue?.message).toBe("Invalid timezone");
    }
  });

  it("fails when cleaningDurationMinutes is negative", () => {
    const result = propertyCreateSchema.safeParse({
      name: "Beach House",
      timezone: "Australia/Sydney",
      cleaningDurationMinutes: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "cleaningDurationMinutes");
      expect(issue?.message).toBe("Must be 0 or more");
    }
  });

  it("fails when cleaningDurationMinutes exceeds 1440", () => {
    const result = propertyCreateSchema.safeParse({
      name: "Beach House",
      timezone: "Australia/Sydney",
      cleaningDurationMinutes: 1441,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "cleaningDurationMinutes");
      expect(issue?.message).toBe("Must be 24 hours or less");
    }
  });

  it("coerces a numeric string for cleaningDurationMinutes", () => {
    const result = propertyCreateSchema.parse({
      name: "Beach House",
      timezone: "Australia/Sydney",
      cleaningDurationMinutes: "60",
    });
    expect(result.cleaningDurationMinutes).toBe(60);
  });

  it("accepts empty string for optional address", () => {
    const result = propertyCreateSchema.parse({
      name: "Beach House",
      timezone: "Australia/Sydney",
      address: "",
    });
    expect(result.address).toBe("");
  });

  it("fails when address exceeds 500 characters", () => {
    const result = propertyCreateSchema.safeParse({
      name: "Beach House",
      timezone: "Australia/Sydney",
      address: "a".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "address");
      expect(issue).toBeDefined();
    }
  });

  it("fails when cleanerName exceeds 255 characters", () => {
    const result = propertyCreateSchema.safeParse({
      name: "Beach House",
      timezone: "Australia/Sydney",
      cleanerName: "a".repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "cleanerName");
      expect(issue).toBeDefined();
    }
  });
});

describe("propertyUpdateSchema", () => {
  it("parses an empty object (all fields optional)", () => {
    const result = propertyUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses a partial payload with only name", () => {
    const result = propertyUpdateSchema.parse({ name: "Renamed" });
    expect(result.name).toBe("Renamed");
  });

  it("still enforces name min length when provided", () => {
    const result = propertyUpdateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue?.message).toBe("Name is required");
    }
  });

  it("still enforces cleaningDurationMinutes max when provided", () => {
    const result = propertyUpdateSchema.safeParse({ cleaningDurationMinutes: 2000 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "cleaningDurationMinutes");
      expect(issue?.message).toBe("Must be 24 hours or less");
    }
  });
});
