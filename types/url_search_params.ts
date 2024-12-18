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

import type { Brand } from "./brand.ts";
import type { OptionalKeys, RequiredKeys } from "./utils.ts";

type URLSearchParamsRecord = Record<string, string>;

/**
 * A {@link Brand branded} string containing the URLSearchParams stringified representation of {@link T}.
 */
export type URLSearchParamsString<T extends URLSearchParamsRecord> = Brand<
  string,
  T
>;

// TODO: Add support for the iterable variant of the init parameter
export type URLSearchParamsInit<T extends URLSearchParamsRecord> =
  | T
  | URLSearchParamsString<T>;

declare interface URLSearchParams<
  T extends URLSearchParamsRecord = URLSearchParamsRecord,
> {
  /**
   * Appends a specified key/value pair as a new search parameter.
   *
   * ```ts
   * let searchParams = new URLSearchParams();
   * searchParams.append('name', 'first');
   * searchParams.append('name', 'second');
   * ```
   */
  append<K extends keyof T>(name: K, value: T[K]): void;

  /**
   * Deletes search parameters that match a name, and optional value,
   * from the list of all search parameters.
   *
   * ```ts
   * let searchParams = new URLSearchParams([['name', 'value']]);
   * searchParams.delete('name');
   * searchParams.delete('name', 'value');
   * ```
   */
  delete<K extends OptionalKeys<T>>(name: K, value?: T[K]): void;

  /**
   * Returns all the values associated with a given search parameter
   * as an array.
   *
   * ```ts
   * searchParams.getAll('name');
   * ```
   */
  get<K extends RequiredKeys<T>>(name: K): [T[K]];
  get<K extends OptionalKeys<T>>(name: K): [] | [T[K]];

  /**
   * Returns the first value associated to the given search parameter.
   *
   * ```ts
   * searchParams.get('name');
   * ```
   */
  get<K extends keyof T>(name: K): T[K];

  /**
   * Returns a boolean value indicating if a given parameter,
   * or parameter and value pair, exists.
   *
   * ```ts
   * searchParams.has('name');
   * searchParams.has('name', 'value');
   * ```
   */
  has<K extends RequiredKeys<T>>(name: K): true;
  has<K extends OptionalKeys<T>>(name: K): boolean;

  /**
   * Sets the value associated with a given search parameter to the
   * given value. If there were several matching values, this method
   * deletes the others. If the search parameter doesn't exist, this
   * method creates it.
   *
   * ```ts
   * searchParams.set('name', 'value');
   * ```
   */
  set<K extends keyof T>(name: K, value: NonNullable<T[K]>): void;

  /**
   * Calls a function for each element contained in this object in
   * place and return undefined. Optionally accepts an object to use
   * as this when executing callback as second argument.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * params.forEach((value, key, parent) => {
   *   console.log(value, key, parent);
   * });
   * ```
   */
  forEach(
    callbackfn: (value: T[keyof T], key: keyof T, parent: this) => void,
    // deno-lint-ignore no-explicit-any
    thisArg?: any,
  ): void;

  /**
   * Returns an iterator allowing to go through all keys contained
   * in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const key of params.keys()) {
   *   console.log(key);
   * }
   * ```
   */
  keys(): IterableIterator<keyof T>;

  /**
   * Returns an iterator allowing to go through all values contained
   * in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const value of params.values()) {
   *   console.log(value);
   * }
   * ```
   */
  values(): IterableIterator<T[keyof T]>;

  /**
   * Returns an iterator allowing to go through all key/value
   * pairs contained in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const [key, value] of params.entries()) {
   *   console.log(key, value);
   * }
   * ```
   */
  entries(): IterableIterator<[keyof T, T[keyof T]]>;

  /**
   * Returns an iterator allowing to go through all key/value
   * pairs contained in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const [key, value] of params) {
   *   console.log(key, value);
   * }
   * ```
   */
  [Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]]>;

  /**
   * Returns a query string suitable for use in a URL.
   *
   * ```ts
   * searchParams.toString();
   * ```
   */
  toString(): URLSearchParamsString<T>;

  /**
   * Contains the number of search parameters
   *
   * ```ts
   * searchParams.size
   * ```
   */
  size: number;
}

declare var URLSearchParams: {
  readonly prototype: URLSearchParams;
  new <T extends URLSearchParamsRecord>(
    init?: URLSearchParamsInit<T>,
  ): URLSearchParams<T>;
};
