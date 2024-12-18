import manifest from "../deno.json" with { type: "json" };

import { build, emptyDir } from "jsr:@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: [
    "./mod.ts",
    {
      kind: "bin",
      name: "typefetch",
      path: "./main.ts",
    },
    {
      kind: "export",
      name: "./types/headers",
      path: "./types/headers.ts",
    },
    {
      kind: "export",
      name: "./types/json",
      path: "./types/json.ts",
    },
    {
      kind: "export",
      name: "./types/url_search_params",
      path: "./types/url_search_params.ts",
    },
    {
      kind: "export",
      name: "./types/url_search_params_string",
      path: "./types/url_search_params_string.ts",
    },
  ],
  filterDiagnostic: (diagnostic) => {
    // Ignore excessively deep and possibly infinite type errors
    if (diagnostic.code === 2589) {
      return false;
    }

    return true;
  },
  scriptModule: false,
  outDir: "./npm",
  shims: {
    deno: true,
    timers: true,
    custom: [
      {
        globalNames: ["addEventListener", "__npm"],
        module: "./node/shims.ts",
      },
    ],
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
    Deno.chmod("npm/esm/main.js", 0o711);
  },
});
