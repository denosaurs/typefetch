import type { Nullish } from "../types/utils.ts";

/**
 * Checks if the given value is not empty.
 * Considers `null`, `undefined`, empty strings, empty object and empty arrays as empty.
 * For other types, it simply checks if they are not `null` or `undefined`.
 *
 * @template T - The type of the value to check.
 * @param {Nullish<T>} x - The value to check.
 * @returns {boolean} `true` if the value is not empty, `false` otherwise.
 *
 * @example
 * notEmpty(null); // returns false
 * notEmpty(undefined); // returns false
 * notEmpty(""); // returns false
 * notEmpty([]); // returns false
 * notEmpty("hello"); // returns true
 * notEmpty([1, 2, 3]); // returns true
 * notEmpty({}); // returns false
 *
 * @warning This function does not check for arrays with only empty elements.
 */
export function notEmpty<T>(x: Nullish<T>): x is T {
  switch (true) {
    case x === null || x === undefined || Number.isNaN(x):
      return false;
    case Array.isArray(x):
    case typeof x === "string":
      return Boolean((x as string | Array<T>).length);
    case typeof x === "object": // Should already have caught arrays.
      return Boolean(Object.entries(x as object).length);
    default:
      return true;
  }
}

/**
 * Checks if the given value is empty.
 * Considers `null`, `undefined`, empty strings, empty object and empty arrays as empty.
 * For other types, it simply checks if they are not `null` or `undefined`.
 *
 * @template T - The type of the value to check.
 * @param {Nullish<T>} x - The value to check.
 * @returns {boolean} `true` if the value is not empty, `false` otherwise.
 *
 * @example
 * empty(null); // returns true
 * empty(undefined); // returns true
 * empty(""); // returns true
 * empty([]); // returns true
 * empty("hello"); // returns false
 * empty([1, 2, 3]); // returns false
 * empty({}); // returns true
 *
 * @warning This function does not check for arrays with only empty elements.
 */
export function empty<T>(x: Nullish<T>): x is null | undefined {
  switch (true) {
    case x === null || x === undefined || Number.isNaN(x):
      return true;
    case Array.isArray(x):
    case typeof x === "string":
      return !(x as string | Array<T>).length;
    case typeof x === "object": // Should already have caught arrays.
      return !Object.entries(x as object).length;
    default:
      return false;
  }
}

/**
 * Checks that an HTTP status code is in the 2xx range.
 */
export function isOk(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Resolves a JSON reference in an object.
 */
export function resolveRef<T = unknown>(object: unknown, ref: string): T {
  if (!ref.startsWith("#/")) {
    throw new TypeError("Only references which start with #/ are supported");
  }

  const parts = ref.slice(2).split("/");
  let value = object as Record<string, T> | T;
  for (const part of parts) {
    if (typeof value !== "object") {
      throw new TypeError(`Reference ${ref} has hit a non-traversable part`);
    }
    if (value === null || value === undefined) {
      throw new TypeError(`Reference ${ref} has hit a nullish part`);
    }
    if (!(part in value)) {
      throw new TypeError(`Reference ${ref} does not exist`);
    }

    value = (value as Record<string, T>)[part];
  }

  return value as T;
}

export function pascalCase() {
}
