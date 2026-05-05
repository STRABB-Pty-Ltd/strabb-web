import { describe, expect, it } from "vitest";

import { ticketCreateSchema, ticketUpdateSchema } from "./ticket";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const ANOTHER_UUID = "22222222-2222-4222-8222-222222222222";

describe("ticketCreateSchema", () => {
  it("parses a valid payload", () => {
    const result = ticketCreateSchema.parse({
      propertyId: VALID_UUID,
      listingId: ANOTHER_UUID,
      description: "Leaky tap in master bathroom",
      priority: "high",
      dateScheduled: "2026-05-01",
      cost: "120.00",
      notes: "Bring tools",
    });
    expect(result.propertyId).toBe(VALID_UUID);
    expect(result.listingId).toBe(ANOTHER_UUID);
    expect(result.priority).toBe("high");
  });

  it("transforms empty listingId to undefined", () => {
    const result = ticketCreateSchema.parse({
      propertyId: VALID_UUID,
      listingId: "",
      description: "Broken light",
      priority: "low",
    });
    expect(result.listingId).toBeUndefined();
  });

  it("transforms empty cost and dateScheduled to undefined", () => {
    const result = ticketCreateSchema.parse({
      propertyId: VALID_UUID,
      description: "Broken light",
      priority: "low",
      dateScheduled: "",
      cost: "",
      notes: "",
    });
    expect(result.dateScheduled).toBeUndefined();
    expect(result.cost).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it("fails when propertyId is missing", () => {
    const result = ticketCreateSchema.safeParse({
      description: "Broken light",
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "propertyId");
      expect(issue).toBeDefined();
    }
  });

  it("fails when propertyId is not a valid uuid", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: "not-a-uuid",
      description: "Broken light",
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "propertyId");
      expect(issue?.message).toBe("Select a property");
    }
  });

  it("fails when listingId is a non-empty non-uuid string", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      listingId: "not-a-uuid",
      description: "Broken light",
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "listingId");
      expect(issue).toBeDefined();
    }
  });

  it("fails when description is missing", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "description");
      expect(issue).toBeDefined();
    }
  });

  it("fails when description is an empty string with the custom message", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      description: "",
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "description");
      expect(issue?.message).toBe("Description is required");
    }
  });

  it("fails when description is whitespace-only (trimmed to empty)", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      description: "   ",
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "description");
      expect(issue?.message).toBe("Description is required");
    }
  });

  it("fails when description exceeds 5000 characters", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      description: "a".repeat(5001),
      priority: "low",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "description");
      expect(issue?.message).toBe("Description must be 5000 characters or fewer");
    }
  });

  it("fails when priority is not in the enum", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      description: "Broken light",
      priority: "critical",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "priority");
      expect(issue).toBeDefined();
    }
  });

  it("fails when notes exceeds 5000 characters", () => {
    const result = ticketCreateSchema.safeParse({
      propertyId: VALID_UUID,
      description: "Broken light",
      priority: "low",
      notes: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "notes");
      expect(issue?.message).toBe("Notes must be 5000 characters or fewer");
    }
  });

  it("accepts every priority value from the enum", () => {
    for (const priority of ["low", "medium", "high", "urgent"] as const) {
      const result = ticketCreateSchema.parse({
        propertyId: VALID_UUID,
        description: "Issue",
        priority,
      });
      expect(result.priority).toBe(priority);
    }
  });
});

describe("ticketUpdateSchema", () => {
  it("parses an empty object (all fields optional)", () => {
    const result = ticketUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses a partial payload with only status", () => {
    const result = ticketUpdateSchema.parse({ status: "completed" });
    expect(result.status).toBe("completed");
  });

  it("accepts every status value from the enum", () => {
    for (const status of [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
    ] as const) {
      const result = ticketUpdateSchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });

  it("fails when status is not in the enum", () => {
    const result = ticketUpdateSchema.safeParse({ status: "archived" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "status");
      expect(issue).toBeDefined();
    }
  });

  it("still enforces description min length when provided", () => {
    const result = ticketUpdateSchema.safeParse({ description: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "description");
      expect(issue?.message).toBe("Description is required");
    }
  });

  it("still enforces propertyId uuid format when provided", () => {
    const result = ticketUpdateSchema.safeParse({ propertyId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "propertyId");
      expect(issue?.message).toBe("Select a property");
    }
  });
});
