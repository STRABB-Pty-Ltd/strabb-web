import { describe, expect, it } from "vitest";

import { otpCodeSchema, phoneNumberSchema } from "./phone";

describe("phoneNumberSchema", () => {
  it("parses a valid phone number", () => {
    expect(phoneNumberSchema.parse("+61412345678")).toBe("+61412345678");
  });

  it("trims surrounding whitespace before validating", () => {
    expect(phoneNumberSchema.parse("  +61412345678  ")).toBe("+61412345678");
  });

  it("fails when shorter than 8 characters", () => {
    const result = phoneNumberSchema.safeParse("12345");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Phone number must be at least 8 characters",
      );
    }
  });

  it("treats whitespace-only input as too short", () => {
    const result = phoneNumberSchema.safeParse("       ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Phone number must be at least 8 characters",
      );
    }
  });

  it("fails when longer than 32 characters", () => {
    const result = phoneNumberSchema.safeParse("+" + "1".repeat(32));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Phone number must be at most 32 characters",
      );
    }
  });

  it("accepts the minimum length boundary (8 chars)", () => {
    expect(phoneNumberSchema.parse("12345678")).toBe("12345678");
  });

  it("accepts the maximum length boundary (32 chars)", () => {
    const value = "1".repeat(32);
    expect(phoneNumberSchema.parse(value)).toBe(value);
  });

  it("fails when the wrong type is supplied", () => {
    const result = phoneNumberSchema.safeParse(61412345678);
    expect(result.success).toBe(false);
  });
});

describe("otpCodeSchema", () => {
  it("parses a valid 6-digit code", () => {
    expect(otpCodeSchema.parse("123456")).toBe("123456");
  });

  it("trims surrounding whitespace before validating", () => {
    expect(otpCodeSchema.parse("  123456  ")).toBe("123456");
  });

  it("fails when shorter than 4 digits", () => {
    const result = otpCodeSchema.safeParse("123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Code must be at least 4 digits",
      );
    }
  });

  it("fails when longer than 10 digits", () => {
    const result = otpCodeSchema.safeParse("12345678901");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Code must be at most 10 digits",
      );
    }
  });

  it("accepts the minimum length boundary (4 chars)", () => {
    expect(otpCodeSchema.parse("1234")).toBe("1234");
  });

  it("accepts the maximum length boundary (10 chars)", () => {
    expect(otpCodeSchema.parse("1234567890")).toBe("1234567890");
  });

  it("fails when the wrong type is supplied", () => {
    const result = otpCodeSchema.safeParse(123456);
    expect(result.success).toBe(false);
  });
});
