// deno-lint-ignore-file no-var

import type { OptionalKeys, RequiredKeys } from "./utils.ts";

// TODO: Allow certain default headers
// type DefaultHeaders =
//   | "accept"
//   | "accept-language"
//   | "content-language"
//   | "content-type"
//   | "content-length";

type HeadersRecord = Record<string, string>;

// TODO: Add support for tuple format of headers
export type TypedHeadersInit<T extends HeadersRecord> = T | Headers<T>;

declare interface Headers<T extends HeadersRecord = HeadersRecord> {
  /**
   * Appends a new value onto an existing header inside a `Headers` object, or
   * adds the header if it does not already exist.
   */
  append<K extends keyof T>(name: K, value: T[K]): void;

  /**
   * Deletes a header from a `Headers` object.
   */
  delete<K extends OptionalKeys<T>>(name: K): void;

  /**
   * Returns a `ByteString` sequence of all the values of a header within a
   * `Headers` object with a given name.
   */
  get<K extends keyof T>(name: K): T[K];

  /**
   * Returns a boolean stating whether a `Headers` object contains a certain
   * header.
   */
  has<K extends RequiredKeys<T>>(name: K): true;
  has<K extends OptionalKeys<T>>(name: K): boolean;

  /**
   * Sets a new value for an existing header inside a Headers object, or adds
   * the header if it does not already exist.
   */
  set<K extends keyof T>(name: K, value: NonNullable<T[K]>): void;

  /** Returns an array containing the values of all `Set-Cookie` headers
   * associated with a response.
   */
  getSetCookie(): string[];
}

declare var Headers: {
  readonly prototype: Headers;
  new <T extends HeadersRecord>(init?: T): Headers<T>;
};
