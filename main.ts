import { parseArgs } from "jsr:@std/cli@0.215";
import { resolve } from "jsr:@std/path@0.215";

import { ModuleDeclarationKind, Project } from "ts-morph";

import { addComponents, addModuleComment, addPathsObject } from "./mod.ts";
import { empty } from "./utils/mod.ts";

export * from "./mod.ts";

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["output", "config"],
    default: {
      output: "./typefetch.d.ts",
    },
  });

  if (args._.length !== 1 || empty(args._[0])) {
    console.error("Expected a single OpenAPI specification to transform");
    Deno.exit(1);
  }

  const input = args._[0] as string;
  const output = resolve(args.output);

  const openapi = (await import(input, { with: { type: "json" } })).default;
  const project = new Project({ tsConfigFilePath: args.config });
  const source = project.createSourceFile(output, undefined, {
    overwrite: true,
  });

  addModuleComment(source, openapi.info);
  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier:
      "https://raw.githubusercontent.com/denosaurs/typefetch/main/types/json.ts",
    namedImports: ["JSONString"],
  });

  const global = source.addModule({
    hasDeclareKeyword: true,
    declarationKind: ModuleDeclarationKind.Global,
    name: "global",
  });

  addPathsObject(global, openapi, openapi.paths);
  addComponents(source, openapi, openapi.components);

  source.formatText({ indentSize: 2 });

  await source.save();
}
