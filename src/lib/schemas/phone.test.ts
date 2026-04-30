import { describe, expect, it } from "vitest";

import { otpCodeSchema, phoneNumberSchema } from "./phone";

const PHONE_ERROR = "Phone must be E.164 format starting with + (e.g. +61412345678)";
const OTP_ERROR = "Code must be 4-10 digits, numbers only";

describe("phoneNumberSchema", () => {
  it("parses a valid E.164 phone number", () => {
    expect(phoneNumberSchema.parse("+61412345678")).toBe("+61412345678");
  });

  it("trims surrounding whitespace before validating", () => {
    expect(phoneNumberSchema.parse("  +61412345678  ")).toBe("+61412345678");
  });

  it("rejects numbers without a leading +", () => {
    const result = phoneNumberSchema.safeParse("61412345678");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PHONE_ERROR);
    }
  });

  it("rejects non-digit characters after the +", () => {
    const result = phoneNumberSchema.safeParse("+61abc345678");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PHONE_ERROR);
    }
  });

  it("rejects too few digits (< 8)", () => {
    const result = phoneNumberSchema.safeParse("+1234567");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PHONE_ERROR);
    }
  });

  it("rejects too many digits (> 15)", () => {
    const result = phoneNumberSchema.safeParse("+1234567890123456");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PHONE_ERROR);
    }
  });

  it("accepts the minimum length boundary (+ then 8 digits)", () => {
    expect(phoneNumberSchema.parse("+12345678")).toBe("+12345678");
  });

  it("accepts the maximum length boundary (+ then 15 digits)", () => {
    expect(phoneNumberSchema.parse("+123456789012345")).toBe("+123456789012345");
  });

  it("treats whitespace-only input as malformed", () => {
    const result = phoneNumberSchema.safeParse("       ");
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
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

  it("rejects non-digit characters", () => {
    const result = otpCodeSchema.safeParse("12a456");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(OTP_ERROR);
    }
  });

  it("rejects too few digits (< 4)", () => {
    const result = otpCodeSchema.safeParse("123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(OTP_ERROR);
    }
  });

  it("rejects too many digits (> 10)", () => {
    const result = otpCodeSchema.safeParse("12345678901");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(OTP_ERROR);
    }
  });

  it("accepts the minimum length boundary (4 digits)", () => {
    expect(otpCodeSchema.parse("1234")).toBe("1234");
  });

  it("accepts the maximum length boundary (10 digits)", () => {
    expect(otpCodeSchema.parse("1234567890")).toBe("1234567890");
  });

  it("rejects non-string types", () => {
    const result = otpCodeSchema.safeParse(123456);
    expect(result.success).toBe(false);
  });
});
