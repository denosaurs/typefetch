/*
 * Certain comments and type definitions are based off work from the official
 * TypeScript project, for those the following attribution is applicable:
 *
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use
 * this file except in compliance with the License. You may obtain a copy of the
 * License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
 * WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
 * MERCHANTABLITY OR NON-INFRINGEMENT.
 *
 * See the Apache Version 2.0 License for specific language governing permissions
 * and limitations under the License.
 */
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

  /**
   * Returns an array containing the values of all `Set-Cookie` headers
   * associated with a response.
   */
  getSetCookie(): string[];
}

declare var Headers: {
  readonly prototype: Headers;
  new <T extends HeadersRecord>(init?: T): Headers<T>;
};
