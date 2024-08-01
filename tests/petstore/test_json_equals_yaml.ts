import type { Equal, Expect } from "npm:type-testing";

import type * as json from "./schemas/petstore.json.ts";
import type * as yaml from "./schemas/petstore.yaml.ts";

type test_JsonPetEqualsYamlPet = Expect<Equal<json.Pet, yaml.Pet>>;
type test_JsonPetsEqualsYamlPets = Expect<Equal<json.Pets, yaml.Pets>>;
type test_JsonErrorEqualsYamlError = Expect<Equal<json.Error, yaml.Error>>;
