import type { Equal, Expect, IsUnion, NotEqual } from "npm:type-testing";

import type { Error, Pets } from "./schemas/petstore.json.ts";

const response = await fetch("http://petstore.swagger.io/v1/pets");

if (response.ok) {
  const json = await response.json();
  type test_IsUnion = Expect<IsUnion<typeof json>>;
  type test_IsPetsOrError = Expect<Equal<typeof json, Pets | Error>>;
}

if (response.status === 200) {
  const pets = await response.json();
  type test_IsPets = Expect<Equal<typeof pets, Pets>>;
  type test_IsNotError = Expect<NotEqual<typeof pets, Error>>;
}
