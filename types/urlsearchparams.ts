// deno-fmt-ignore-file

/**
 * You are in for a ride.
 * 
 * This file essentially only implements a single type: `URLSearchParamsString`.
 * It is a generic template string type which enforces the structure and
 * contents of string to conform to the passed record type.
 * 
 * The type is complex, slow and may be "excessively deep and possibly infinite"
 * so maybe don't use it in anything you want to be fast but it  was a fun
 * exercise which I may enable behind a flag.
 * 
 * @module
 */

type URLSearchParamsValue = string | number | boolean | undefined | null;
type URLSearchParamsRecord = Record<string, URLSearchParamsValue>;
type URLSearchParamsKeyValue<K extends string, V extends URLSearchParamsValue> =
  V extends true ? `${K}=true` | K
                 : `${K}=${NonNullable<V>}`;

/**
 * Recursively join the generic tuple of strings `A` into a single string
 * delimited by the generic `S`. The generic `R` is used to accumulate the
 * result.
 */
type Join<A extends readonly string[], S extends string = "", R extends string = ""> =
  // Early exit if the tuple is empty
    A extends [] ? R
  // Split out the head and tail of the tuple. Assert the type of the head and
  // tail, we need to do this to get narrowing even though it is guaranteed by
  // the type signature of the generic `A`.
  : A extends [infer Head, ...infer Tail] ? Head extends string ? Tail extends string[]
    // We skip the delimiter if the head is an empty string. This essentially
    // filters out any empty strings from the tuple.
    ? Head extends "" ? Join<Tail, S, R>
    // Join the tail with the head and the delimiter. If the accumulator is
    // empty we skip the delimiter. This is to avoid leading delimiters.
    : Join<Tail, S, R extends "" ? `${Head}` : `${R}${S}${Head}`>
  : never : never
  // Finally return the accumulated result.
  : R;

/** Prefixes the generic `S` with `P` if `S` is not an empty string */
type Prefix<S extends string, P extends string> = S extends "" ? "" : `${P}${S}`;

/** Replaces never values with an empty string */
type ReplaceNever<T> = [T] extends [never] ? "" : T;

/**
 * Recursively generate a union of tuples in all possible orders and
 * combinations of the generic union `T`. The generic `R` is used to accumulate
 * the result.
 * 
 * @example MayInclude<"a" | "b"> = [] | ["a"] | ["b", "a"] | ["b"] | ["a", "b"]
 */
type MayInclude<T extends string, R extends readonly string[] = []> = R | { [K in T]: MayInclude<Exclude<T, K>, [K, ...R]> }[T];

/**
 * Recursively generate a union of tuples in all possible orders of the generic
 * union `T`.
 * 
 * @example MustInclude<"a" | "b"> = ["a", "b"] | ["b", "a"]
 * @example MustInclude<"a" | "b" | "c"> = ["a", "b", "c"] | ["a", "c", "b"] | ["b", "a", "c"] | ["b", "c", "a"] | ["c", "a", "b"] | ["c", "b", "a"]
 */
type MustInclude<T extends string> = { [K in T]: Exclude<T, K> extends never ? [K] : [K, ...MustInclude<Exclude<T, K>>] }[T];

/**
 * Extracts all required search params as a union of `URLSearchParamsKeyValue`
 * from the generic `T`.
 */
type RequiredURLSearchParams<T extends URLSearchParamsRecord> = {
  [K in keyof T]-?: K extends string
  ? undefined extends T[K] ? never
  : null extends T[K] ? never
  : URLSearchParamsKeyValue<K, T[K]>
  : never
}[keyof T];

/**
 * Extracts all optional search params as a union of `URLSearchParamsKeyValue`
 * from the generic `T`.
 */
type OptionalURLSearchParams<T extends URLSearchParamsRecord> = {
  [K in keyof T]-?: K extends string
  ? undefined extends T[K] ? URLSearchParamsKeyValue<K, T[K]>
  : null extends T[K] ? URLSearchParamsKeyValue<K, T[K]>
  : never
  : never
}[keyof T];

/**
 * Converts a generic `URLSearchParamsRecord` into a string that can be used as
 * a query string in a URL.
 */
export type URLSearchParamsString<T extends URLSearchParamsRecord> =
  Prefix<Join<[Join<MustInclude<ReplaceNever<RequiredURLSearchParams<T>>>>, Join<MayInclude<OptionalURLSearchParams<T>>, "&">], "&">, "?">;
