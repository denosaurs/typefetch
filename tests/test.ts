import { walk } from "jsr:@std/fs";
import { assert } from "jsr:@std/assert";

import { globToRegExp } from "@std/path";

const pwd = import.meta.resolve("../");
const main = import.meta.resolve("../main.ts");

Deno.test("Generate schemas", async ({ step }) => {
  for await (
    const schema of walk("./tests/", {
      match: [globToRegExp("**/schemas/*.{json,yml,yaml}")],
    })
  ) {
    await step(`Generating schema for ${schema.path}`, async () => {
      const path = import.meta.resolve(`../${schema.path}`);
      const output = await new Deno.Command("deno", {
        args: ["run", "-A", main, `-o=${path}.ts`, `--import=${pwd}`, path],
        stdout: "inherit",
        stderr: "inherit",
      }).output();
      assert(output.success);
    });
  }
});

Deno.test("Check types", async ({ step }) => {
  for await (
    const test of walk("./tests/", {
      match: [globToRegExp("*/!(schemas)/*.ts")],
    })
  ) {
    await step(`Checking types for ${test.path}`, async () => {
      const path = import.meta.resolve(`../${test.path}`);
      const output = await new Deno.Command("deno", {
        args: ["check", path],
        stdout: "inherit",
        stderr: "inherit",
      }).output();
      assert(output.success);
    });
  }
});
