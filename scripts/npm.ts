import manifest from "../deno.json" with { type: "json" };

import { build, emptyDir } from "jsr:@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: [{
    kind: "bin",
    name: "typefetch",
    path: "./main.ts",
  }],
  scriptModule: false,
  outDir: "./npm",
  shims: {
    deno: true,
    timers: true,
    custom: [{
      globalNames: ["addEventListener"],
      module: "./node/shims.ts",
    }],
  },
  test: false,
  importMap: "./deno.json",
  package: {
    name: manifest.name,
    version: manifest.version,
    description:
      "📤 Magically generate `fetch` types from OpenAPI schemas for zero-cost browser-native api clients",
    keywords: [
      "fetch",
      "openapi",
      "swagger",
      "api",
      "rest",
      "typescript",
      "types",
      "ts",
      "dts",
      "node",
      "deno",
      "browser",
    ],
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/denosaurs/typefetch.git",
    },
    bugs: {
      url: "https://github.com/denosaurs/typefetch/issues",
    },
  },
  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");

    // Add shebang to main.js
    const main = Deno.readTextFileSync("npm/esm/main.js");
    Deno.writeTextFileSync(
      "npm/esm/main.js",
      `#!/usr/bin/env node --no-warnings=ExperimentalWarning\n${main}`,
    );
  },
});
