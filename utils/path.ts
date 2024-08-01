import { fromFileUrl, resolve as pathResolve } from "@std/path";

export function resolve(path: string | URL): string {
  if (URL.canParse(path)) {
    try {
      path = fromFileUrl(path);
      // deno-lint-ignore no-empty
    } catch {}
  }

  if (path instanceof URL) {
    throw new TypeError("URLs must be able to be resolved to file paths");
  }

  return pathResolve(path);
}
