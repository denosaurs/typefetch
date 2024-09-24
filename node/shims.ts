// deno-lint-ignore-file no-explicit-any
import process from "node:process";

export function addEventListener(
  type: "unload",
  listener: () => any,
  options?: never,
): void {
  if (type !== "unload") {
    console.warn(
      "The `addEventListener` shim does not support any event type other than `unload`",
    );
    return;
  }
  if (listener.length >= 1) {
    console.warn(
      "The `addEventListener` shim does not support any arguments passed to the listener",
    );
    return;
  }
  if (options !== undefined) {
    console.warn("The `addEventListener` shim does not support options");
    return;
  }

  process.on("exit", listener);
  process.on("beforeExit", listener);
  process.on("SIGINT", listener);
  process.on("uncaughtException", listener);
}

export const __npm = true;
