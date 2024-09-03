import type { Equal, Expect } from "npm:type-testing";

import type { Pet } from "./schemas/petstore.json.ts";

type test_PetTagPropertyIsOptional = Expect<
  Equal<Pick<Pet, "tag">, { tag?: string }>
>;
type test_PetRestPropertiesIsRequired = Expect<
  Equal<Omit<Pet, "tag">, { id: number; name: string }>
>;
