import { parseArgs } from "@std/cli/parse-args";
import * as yaml from "@std/yaml/parse";
import { wait } from "@denosaurs/wait";

import { ModuleDeclarationKind, Project } from "ts-morph";

import { addComponents, addPathsObject, writeModuleComment } from "./mod.ts";
import { empty, resolve } from "./utils/mod.ts";

import manifest from "./deno.json" with { type: "json" };

export * from "./mod.ts";

const parseOptions = {
  string: [
    "output",
    "config",
    "import",
    "base-urls",
    "experimental-discriminator",
  ],
  boolean: [
    "help",
    "include-absolute-url",
    "include-server-urls",
    "include-relative-url",
    "experimental-urlsearchparams",
    "experimental-require-discriminator",
  ],
  alias: { output: "o", help: "h", version: "V" },
  default: {
    output: "./typefetch.d.ts",
    import: "__npm" in globalThis
      ? manifest.name
      : "https://raw.githubusercontent.com/denosaurs/typefetch/main",
    "include-server-urls": true,
    "include-absolute-url": false,
    "include-relative-url": false,
    "experimental-urlsearchparams": false,
    "experimental-discriminator": false,
    "experimental-require-discriminator": false,
  },
  unknown: (arg: string, key?: string) => {
    if (key === undefined) return;

    console.error(
      `Unknown option: ${arg}\n` +
        `Run typefetch --help to see a list of available options`,
    );
    Deno.exit(1);
  },
} as const;

const args = parseArgs(Deno.args, parseOptions);

if (args.help) {
  // deno-fmt-ignore
  console.log(
    `Usage: typefetch [OPTIONS] <PATH>\n\n` +
      `Options:\n` +
      `  -h, --help                                Print this help message\n` +
      `  -V, --version                             Print the version of TypeFetch\n` +
      `  -o, --output    <PATH>                    Output file path                                                   (default: ${parseOptions.default["output"]})\n` +
      `      --config    <PATH>                    File path to the tsconfig.json file\n` +
      `      --import    <PATH>                    Import path for TypeFetch                                          (default: ${parseOptions.default["import"]})\n` +
      `      --base-urls <URLS>                    A comma separated list of custom base urls for paths to start with\n` +
      `      --include-server-urls                 Include server URLs from the schema in the generated paths         (default: ${parseOptions.default["include-server-urls"]})\n` +
      `      --include-absolute-url                Include absolute URLs in the generated paths                       (default: ${parseOptions.default["include-absolute-url"]})\n` +
      `      --include-relative-url                Include relative URLs in the generated paths                       (default: ${parseOptions.default["include-relative-url"]})\n` +
      `      --experimental-urlsearchparams        Enable the experimental fully typed URLSearchParamsString type     (default: ${parseOptions.default["experimental-urlsearchparams"]})\n` +
      `      --experimental-discriminator          Allows you to specify a discriminator generic argument to fetch    (default: ${parseOptions.default["experimental-discriminator"]})\n` +
      `      --experimental-require-discriminator  Makes the use of a discriminator generic argument required         (default: ${parseOptions.default["experimental-require-discriminator"]})\n`,
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

const importSpinner = wait("Resolving schema").start();
const input = args._[0] as string;
const output = resolve(args.output);

let openapi;
try {
  importSpinner.text = "Trying to import OpenAPI schema as JSON";
  openapi = (await import(input, { with: { type: "json" } })).default;
} catch (error) {
  importSpinner.text = "Trying to import OpenAPI schema as YAML";
  try {
    // Try to import the OpenAPI schema as YAML
    openapi = yaml.parse(await (await fetch(input)).text());
  } catch {
    importSpinner.fail(`Failed to load OpenAPI schema from ${input}`);
    console.group();
    console.error(error);
    console.groupEnd();
    Deno.exit(1);
  }
}
importSpinner.succeed("Schema resolved");

const baseImport = args.import.replace(/\/$/, "");
const options = {
  baseUrls: args["base-urls"]?.split(","),
  includeAbsoluteUrl: args["include-absolute-url"],
  includeServerUrls: args["include-server-urls"],
  includeRelativeUrl: args["include-relative-url"],
  experimentalURLSearchParams: args["experimental-urlsearchparams"],
  experimentalDiscriminator: args["experimental-discriminator"],
  experimentalRequireDiscriminator: args["experimental-require-discriminator"],
};

const project = new Project({ tsConfigFilePath: args.config });
const source = project.createSourceFile(output, undefined, {
  overwrite: true,
});

source.addImportDeclaration({
  isTypeOnly: true,
  moduleSpecifier: `${baseImport}/types/json${
    URL.canParse(baseImport) ? ".ts" : ""
  }`,
  namedImports: ["JSONString"],
});

source.addImportDeclaration({
  isTypeOnly: true,
  moduleSpecifier: `${baseImport}/types/headers${
    URL.canParse(baseImport) ? ".ts" : ""
  }`,
  namedImports: ["TypedHeadersInit"],
});

if (options.experimentalURLSearchParams) {
  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: `${baseImport}/types/url_search_params_string${
      URL.canParse(baseImport) ? ".ts" : ""
    }`,
    namedImports: ["URLSearchParamsString"],
  });
} else {
  source.addImportDeclaration({
    isTypeOnly: true,
    moduleSpecifier: `${baseImport}/types/url_search_params${
      URL.canParse(baseImport) ? ".ts" : ""
    }`,
    namedImports: ["URLSearchParamsString"],
  });
}

source.insertText(0, (writer) => {
  writeModuleComment(writer, openapi.info);
});

const global = source.addModule({
  hasDeclareKeyword: true,
  declarationKind: ModuleDeclarationKind.Global,
  name: "global",
});

addPathsObject(global, openapi, openapi.paths, options);
addComponents(source, openapi, openapi.components);

const saveSpinner = wait("Saving generated definitions").start();
source.formatText({ indentSize: 2, ensureNewLineAtEndOfFile: true });
await source.save();
saveSpinner.succeed("Definitions saved");
