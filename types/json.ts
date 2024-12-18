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
// deno-lint-ignore-file no-explicit-any

import type { Brand } from "./brand.ts";

/**
 * A {@link Brand branded} string containing the JSON stringified representation of {@link T}.
 */
export type JSONString<T> = Brand<string, T>;

declare global {
  interface JSON {
    /**
     * Converts a {@link Brand branded} JavaScript Object Notation (JSON) string into an object of type {@link T}.
     *
     * @param text A valid {@link Brand branded} JSON string.
     * @param reviver A function that transforms the results. This function is called for each member of the object.
     * If a member contains nested objects, the nested objects are transformed before the parent object is.
     */
    parse<T>(
      text: JSONString<T>,
      reviver?: (this: any, key: string, value: any) => any,
    ): T;
    /**
     * Converts a JavaScript value of type {@link T} to a {@link Brand branded} JavaScript Object Notation (JSON) string.
     *
     * @param value A JavaScript value, usually an object or array, to be converted.
     * @param replacer A function that transforms the results.
     * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
     */
    stringify<T>(
      value: T,
      replacer?: (number | string)[] | null,
      space?: string | number,
    ): JSONString<T>;
    /**
     * Converts a JavaScript value of type {@link T} to a {@link Brand branded} JavaScript Object Notation (JSON) string.
     *
     * @param value A JavaScript value, usually an object or array, to be converted.
     * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
     * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
     */
    stringify<T>(
      value: T,
      replacer?: (this: any, key: string, value: any) => any,
      space?: string | number,
    ): JSONString<T>;
  }
}
