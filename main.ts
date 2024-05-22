import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import * as yaml from "@std/yaml";

import { ModuleDeclarationKind, Project } from "ts-morph";

import { addComponents, addPathsObject, writeModuleComment } from "./mod.ts";
import { empty } from "./utils/mod.ts";

import manifest from "./deno.json" with { type: "json" };

export * from "./mod.ts";

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["output", "config", "import"],
    boolean: ["help"],
    alias: { help: "h", version: "V" },
    default: {
      output: "./typefetch.d.ts",
      import: "https://raw.githubusercontent.com/denosaurs/typefetch/main",
    },
    unknown: (arg, key) => {
      if (key === undefined) return;

      console.error(
        `Unknown option: ${arg}\n` +
          `Run typefetch --help to see a list of available options`,
      );
      Deno.exit(1);
    },
  });

  if (args.help) {
    console.log(
      `Usage: typefetch [OPTIONS] <FILE>\n\n` +
        `Options:\n` +
        `  -h, --help           Print this help message\n` +
        `  -V, --version        Print the version of TypeFetch\n\n` +
        `      --output <FILE>  Output file path                     (default: typefetch.d.ts)\n` +
        `      --config <FILE>  File path to the tsconfig.json file\n` +
        `      --import <PATH>  Import path for TypeFetch            (default: https://raw.githubusercontent.com/denosaurs/typefetch/main)`,
    );
    Deno.exit(0);
  }

  if (args.version) {
    console.log(manifest.version);
    Deno.exit(0);
  }

  if (args._.length !== 1 || empty(args._[0])) {
    console.error(
      `Expected a single OpenAPI schema to transform\n` +
        `Run typefetch --help for more information`,
    );
    Deno.exit(1);
  }

  const input = args._[0] as string;
  const output = resolve(args.output);

  let openapi;
  try {
    openapi = (await import(input, { with: { type: "json" } })).default;
  } catch (error) {
    try {
      // Try to import the OpenAPI schema as YAML
      openapi = yaml.parse(await (await fetch(input)).text());
    } catch {
      console.error(`Failed to load OpenAPI schema from ${input}`);
      console.group();
      console.error(error);
      console.groupEnd();
      Deno.exit(1);
    }
  }

  const project = new Project({ tsConfigFilePath: args.config });
  const source = project.createSourceFile(output, undefined, {
    overwrite: true,
  });

  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: `${args["import"]}/types/json${URL.canParse(args["import"]) ? ".ts" : ""}`,
    namedImports: ["JSONString"],
  });

  source.insertText(0, (writer) => {
    writeModuleComment(writer, openapi.info);
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
