/** Convert a snake_case string to camelCase. */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Convert a camelCase string to snake_case. */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Recursively transform all keys of an object using the provided function.
 * Handles nested objects and arrays. Leaves non-object values unchanged.
 */
export function transformKeys<T>(obj: unknown, fn: (key: string) => string): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, fn)) as T;
  }

  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[fn(key)] = transformKeys(value, fn);
    }
    return result as T;
  }

  return obj as T;
}

/** Convert all keys in an object from snake_case to camelCase. */
export function keysToCamel<T>(obj: unknown): T {
  return transformKeys<T>(obj, snakeToCamel);
}

/** Convert all keys in an object from camelCase to snake_case. */
export function keysToSnake<T>(obj: unknown): T {
  return transformKeys<T>(obj, camelToSnake);
}
