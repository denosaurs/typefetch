# TypeFetch

TypeFetch is a tool for generating zero-cost type-safe `fetch` clients from
OpenAPI schemas. It works everywhere you can call `fetch`, and anywhere you can
use TypeScript.

## Usage

To use TypeFetch, you need to have an OpenAPI schema. You can either provide a
local file path or a URL to the schema (which can be either json or yaml), then
all you need to do is run the cli using deno, node, or any other JavaScript
runtime supported by the [jsr](https://jsr.io) registry.

```sh
deno run -A jsr:@denosaurs/typefetch
```

```
Usage: typefetch [OPTIONS] <PATH>

Options:
  -h, --help                          Print this help message
  -V, --version                       Print the version of TypeFetch
  -o, --output   <PATH>               Output file path                                            (default: typefetch.d.ts)
      --config   <PATH>               File path to the tsconfig.json file
      --import   <PATH>               Import path for TypeFetch                                   (default: https://raw.githubusercontent.com/denosaurs/typefetch/main)
      --base-url <URL>                A custom base url for paths to start with
      --include-base-url              Include the base url in the generated paths                 (default: false)
      --include-server-urls           Include server URLs from the schema in the generated paths  (default: true)
      --include-relative-url          Include relative URLs in the generated paths                (default: false)
      --experimental-urlsearchparams  Enable the experimental fully typed URLSearchParams type    (default: false)
```

## Example

```sh
deno run -A jsr:@denosaurs/typefetch https://api.jsr.io/.well-known/openapi
```

This will generate a `typefetch.d.ts` file in the current directory, which will
modify the global scope and the type definitions for the `fetch` function and
all types defined within the schema. For example:

```ts
declare global {
  ...
  /**
   * Returns a list of packages
   * @summary List packages
   */
  function fetch(
    input: `https://api.jsr.io/packages` | `/packages`,
    init?: Omit<RequestInit, "method" | "body" | "headers"> & {
      method: "GET";
    },
  ): Promise<
    & Omit<
      Response,
      "ok" | "status" | "arrayBuffer" | "blob" | "formData" | "json" | "text"
    >
    & (
      | ({
        ok: true;
        status: 200;
        json(): Promise<{ items: Package[]; total: number }>;
        text(): Promise<JSONString<{ items: Package[]; total: number }>>;
      })
      | ({
        ok: false;
        status: 400;
        json(): Promise<Error>;
        text(): Promise<JSONString<Error>>;
      })
    )
  >;
  ...
}
```

Which now allows you to use the `fetch` function with the
`https://api.jsr.io/packages` endpoint as following:

```ts
const response = await fetch("https://api.jsr.io/packages");

// The ok and status properties work as discriminators here to narrow the
// types of the response. That way the json and text methods are made
// type-safe.
if (response.ok) {
  console.assert(response.status === 200);

  const { items, total } = await response.json();
  // even this works because we augment the global JSON object!
  const { items, total } = JSON.parse(await response.text());
} else {
  console.assert(response.status === 400);

  const error = await response.json();
  // or
  const error = JSON.parse(await response.text());
}
```

## Maintainers

- Elias Sjögreen ([@eliassjogreen](https://github.com/eliassjogreen))

## Contributing

Pull request, issues and feedback are very welcome. Code style is formatted with
`deno fmt` and commit messages are done following Conventional Commits spec.

Please use it! And let us know if you have any issues, feedback or requests.

## Licence

Copyright 2024, the Denosaurs team. All rights reserved. MIT license.
