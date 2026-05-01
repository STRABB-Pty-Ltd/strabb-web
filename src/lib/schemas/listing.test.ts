import { describe, expect, it } from "vitest";

import { listingCreateSchema, listingUpdateSchema } from "./listing";

describe("listingCreateSchema", () => {
  it("parses a valid payload", () => {
    const result = listingCreateSchema.parse({
      propertyId: "prop-1",
      name: "Beach House on Airbnb",
      platform: "airbnb",
      externalListingId: "ABC123",
      icalFeedUrl: "https://example.com/feed.ics",
    });
    expect(result.name).toBe("Beach House on Airbnb");
    expect(result.icalFeedUrl).toBe("https://example.com/feed.ics");
  });

  it("parses without the optional fields", () => {
    const result = listingCreateSchema.parse({
      propertyId: "prop-1",
      name: "Beach House",
      platform: "direct",
    });
    expect(result.externalListingId).toBeUndefined();
  });

  it("fails when propertyId is missing", () => {
    const result = listingCreateSchema.safeParse({ name: "Beach House", platform: "airbnb" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "propertyId");
      expect(issue).toBeDefined();
    }
  });

  it("fails when propertyId is empty string", () => {
    const result = listingCreateSchema.safeParse({
      propertyId: "",
      name: "Beach House",
      platform: "airbnb",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "propertyId");
      expect(issue?.message).toBe("Property is required");
    }
  });

  it("fails when name is missing", () => {
    const result = listingCreateSchema.safeParse({ propertyId: "prop-1", platform: "airbnb" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue).toBeDefined();
    }
  });

  it("fails when name is an empty string with the custom message", () => {
    const result = listingCreateSchema.safeParse({
      propertyId: "prop-1",
      name: "",
      platform: "airbnb",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue?.message).toBe("Name is required");
    }
  });

  it("fails when name exceeds 255 characters", () => {
    const result = listingCreateSchema.safeParse({
      propertyId: "prop-1",
      name: "a".repeat(256),
      platform: "airbnb",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue).toBeDefined();
    }
  });

  it("fails when platform is missing", () => {
    const result = listingCreateSchema.safeParse({ propertyId: "prop-1", name: "Beach House" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "platform");
      expect(issue).toBeDefined();
    }
  });

  it("fails when platform is an empty string with the custom message", () => {
    const result = listingCreateSchema.safeParse({
      propertyId: "prop-1",
      name: "Beach House",
      platform: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "platform");
      expect(issue?.message).toBe("Platform is required");
    }
  });

  it("fails when icalFeedUrl is not a valid URL", () => {
    const result = listingCreateSchema.safeParse({
      propertyId: "prop-1",
      name: "Beach House",
      platform: "airbnb",
      icalFeedUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "icalFeedUrl");
      expect(issue?.message).toBe("Must be a valid URL");
    }
  });

  it("accepts an empty string for icalFeedUrl", () => {
    const result = listingCreateSchema.parse({
      propertyId: "prop-1",
      name: "Beach House",
      platform: "airbnb",
      icalFeedUrl: "",
    });
    expect(result.icalFeedUrl).toBe("");
  });

  it("accepts an empty string for externalListingId", () => {
    const result = listingCreateSchema.parse({
      propertyId: "prop-1",
      name: "Beach House",
      platform: "airbnb",
      externalListingId: "",
    });
    expect(result.externalListingId).toBe("");
  });

  it("fails when externalListingId exceeds 255 characters", () => {
    const result = listingCreateSchema.safeParse({
      propertyId: "prop-1",
      name: "Beach House",
      platform: "airbnb",
      externalListingId: "a".repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "externalListingId");
      expect(issue).toBeDefined();
    }
  });
});

describe("listingUpdateSchema", () => {
  it("parses an empty object (all fields optional)", () => {
    const result = listingUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses a partial payload with only name", () => {
    const result = listingUpdateSchema.parse({ name: "Renamed" });
    expect(result.name).toBe("Renamed");
  });

  it("does not accept propertyId (omitted from update schema)", () => {
    const result = listingUpdateSchema.parse({
      propertyId: "prop-2",
      name: "Renamed",
    } as never);
    expect((result as { propertyId?: string }).propertyId).toBeUndefined();
  });

  it("still enforces icalFeedUrl format when provided", () => {
    const result = listingUpdateSchema.safeParse({ icalFeedUrl: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "icalFeedUrl");
      expect(issue?.message).toBe("Must be a valid URL");
    }
  });

  it("still enforces name min length when provided", () => {
    const result = listingUpdateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "name");
      expect(issue?.message).toBe("Name is required");
    }
  });
});
