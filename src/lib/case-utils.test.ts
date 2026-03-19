import { describe, expect, it } from "vitest";

import { camelToSnake, keysToCamel, keysToSnake, snakeToCamel } from "./case-utils";

describe("snakeToCamel", () => {
  it("converts simple snake_case", () => {
    expect(snakeToCamel("tenant_id")).toBe("tenantId");
  });

  it("converts multiple underscores", () => {
    expect(snakeToCamel("access_token_expires")).toBe("accessTokenExpires");
  });

  it("leaves camelCase unchanged", () => {
    expect(snakeToCamel("tenantId")).toBe("tenantId");
  });

  it("leaves single words unchanged", () => {
    expect(snakeToCamel("name")).toBe("name");
  });
});

describe("camelToSnake", () => {
  it("converts simple camelCase", () => {
    expect(camelToSnake("tenantId")).toBe("tenant_id");
  });

  it("converts multiple capitals", () => {
    expect(camelToSnake("accessTokenExpires")).toBe("access_token_expires");
  });

  it("leaves snake_case unchanged", () => {
    expect(camelToSnake("tenant_id")).toBe("tenant_id");
  });
});

describe("keysToCamel", () => {
  it("converts flat object keys", () => {
    const input = { tenant_id: "abc", user_name: "test" };
    const result = keysToCamel<{ tenantId: string; userName: string }>(input);
    expect(result).toEqual({ tenantId: "abc", userName: "test" });
  });

  it("converts nested object keys", () => {
    const input = { user_data: { first_name: "Chris", last_name: "P" } };
    const result = keysToCamel(input);
    expect(result).toEqual({ userData: { firstName: "Chris", lastName: "P" } });
  });

  it("converts keys in arrays", () => {
    const input = [{ tenant_id: 1 }, { tenant_id: 2 }];
    const result = keysToCamel(input);
    expect(result).toEqual([{ tenantId: 1 }, { tenantId: 2 }]);
  });

  it("leaves primitive values unchanged", () => {
    expect(keysToCamel("hello")).toBe("hello");
    expect(keysToCamel(42)).toBe(42);
    expect(keysToCamel(null)).toBe(null);
  });
});

describe("keysToSnake", () => {
  it("converts flat object keys", () => {
    const input = { tenantId: "abc", userName: "test" };
    const result = keysToSnake(input);
    expect(result).toEqual({ tenant_id: "abc", user_name: "test" });
  });
});
