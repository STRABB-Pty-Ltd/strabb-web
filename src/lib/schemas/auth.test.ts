import { describe, expect, it } from "vitest";

import { loginSchema } from "./auth";

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
      const passwordIssue = result.error.issues.find(
        (i) => i.path[0] === "password",
      );
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
      const passwordIssue = result.error.issues.find(
        (i) => i.path[0] === "password",
      );
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
