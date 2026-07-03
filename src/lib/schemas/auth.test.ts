import { describe, expect, it } from "vitest";

import {
  acceptInviteSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
} from "./auth";

describe("loginSchema", () => {
  it("parses a valid login payload", () => {
    const result = loginSchema.parse({
      email: "user@example.com",
      password: "hunter2",
    });
    expect(result).toEqual({
      email: "user@example.com",
      password: "hunter2",
    });
  });

  it("fails when email is missing", () => {
    const result = loginSchema.safeParse({ password: "hunter2" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailIssue).toBeDefined();
    }
  });

  it("fails when email is not a valid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "hunter2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailIssue?.message).toBe("Enter a valid email address");
    }
  });

  it("fails when email is the wrong type", () => {
    const result = loginSchema.safeParse({
      email: 123,
      password: "hunter2",
    });
    expect(result.success).toBe(false);
  });

  it("fails when password is missing", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((i) => i.path[0] === "password");
      expect(passwordIssue).toBeDefined();
    }
  });

  it("fails with the schema error when password is empty", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((i) => i.path[0] === "password");
      expect(passwordIssue?.message).toBe("Password is required");
    }
  });

  it("fails when password is the wrong type", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: 12345,
    });
    expect(result.success).toBe(false);
  });
});

describe("passwordSchema (mirrors API policy: >=10 chars, >=1 letter, >=1 digit)", () => {
  it("accepts a 10-char password with a letter and a digit", () => {
    expect(passwordSchema.safeParse("abcd123456").success).toBe(true);
  });

  it("rejects a 9-char password even with a letter and a digit", () => {
    const result = passwordSchema.safeParse("abcd12345");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 10 characters");
    }
  });

  it("rejects a long password with no digit", () => {
    const result = passwordSchema.safeParse("abcdefghijklmnop");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("one number"))).toBe(true);
    }
  });

  it("rejects a long password with no letter", () => {
    const result = passwordSchema.safeParse("1234567890123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("one letter"))).toBe(true);
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching policy-compliant passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "abcd123456",
      confirmPassword: "abcd123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when the passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "abcd123456",
      confirmPassword: "abcd123457",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(issue?.message).toBe("Passwords do not match");
    }
  });

  it("rejects a weak password before checking the match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("acceptInviteSchema", () => {
  it("accepts a full name with matching policy-compliant passwords", () => {
    const result = acceptInviteSchema.safeParse({
      fullName: "Ada Lovelace",
      password: "abcd123456",
      confirmPassword: "abcd123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank full name", () => {
    const result = acceptInviteSchema.safeParse({
      fullName: "",
      password: "abcd123456",
      confirmPassword: "abcd123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "fullName");
      expect(issue?.message).toBe("Enter your full name");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = acceptInviteSchema.safeParse({
      fullName: "Ada",
      password: "abcd123456",
      confirmPassword: "different99",
    });
    expect(result.success).toBe(false);
  });
});
