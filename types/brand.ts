declare const brand: unique symbol;

/**
 * The {@link Brand} type brands the type {@link T} with a brand of the type
 * {@link B}. This makes it so the Branded type incompatible with the type of
 * {@link T} even though their data might be the same.
 *
 * In fancy terms it is a way of achieving
 * {@link https://en.wikipedia.org/wiki/Nominal_type_system nominal typing}
 * within TypeScripts
 * {@link https://en.wikipedia.org/wiki/Structural_type_system structural typing}.
 *
 * Usecases for branded types may be things such as certain types of validated
 * strings, ids and tokens.
 *
 * @example
 * ```ts
 * type Password = Brand<string, "Password">;
 *
 * function isPassword(text: string): text is Password {
 *   return text.length >= 8;
 * }
 *
 * const input = "this is a valid password";
 *
 * if (isPassword(input)) {
 *   // `input` is now narrowed down to the branded type `Password`
 * }
 * ```
 */
export type Brand<T, B> = T & { [brand]: B };

/**
 * Obtain the structural type of {@link T} extending {@link Brand}.
 */
export type TypeOf<T extends Brand<unknown, unknown>> = T extends
  Brand<infer U, infer _> ? U : never;

/**
 * Obtain the brand of {@link T} extending {@link Brand}.
 */
export type BrandOf<T extends Brand<unknown, unknown>> = T extends
  Brand<infer _, infer B> ? B : never;
