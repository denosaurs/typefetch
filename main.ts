import { parseArgs } from "jsr:@std/cli";
import { resolve } from "jsr:@std/path";

import { ModuleDeclarationKind, Project } from "ts-morph";

import manifest from "./deno.json" with { type: "json" };

import { addModuleComment, addComponents, addPathsObject } from "./mod.ts";

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["output", "ts-config"],
    default: {
      output: "./typefetch.d.ts",
    },
  });

  if (args._.length !== 1) {
    console.error("Expected a single OpenAPI specification to transform");
    Deno.exit(1);
  }
  
  const input = resolve(args._[0]);
  const output = resolve(args.output);
  
  const openapi = (await import(input, { with: { type: "json" } })).default;
  const project = new Project({ tsConfigFilePath: args.config });
  const source = project.createSourceFile(output, undefined, { overwrite: true });
  const global = source.addModule({
    hasDeclareKeyword: true,
    declarationKind: ModuleDeclarationKind.Global,
    name: "global",
  });

  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: `jsr:${manifest.name}@${manifest.version}/types/json`,
    namedImports: ["JSONString"],
  });

  addModuleComment(source, openapi.info);
  addPathsObject(global, openapi, openapi.paths);
  addComponents(source, openapi, openapi.components);

  source.formatText({ indentSize: 2 });

  await source.save();
}
