// deno-lint-ignore-file ban-types

/**
 * A type that represents a value that can be null or undefined.
 */
export type Nullish<T> = T | null | undefined;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
