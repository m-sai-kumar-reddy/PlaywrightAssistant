import { ensureAdapter } from "../core/engine/index.ts";

export async function waitForUrlMatch(
  expected: string,
  options?: { timeout?: number; interval?: number; partial?: boolean }
) {
  const adapter = ensureAdapter();
  const timeout = options?.timeout ?? 5000; // default 5s
  const interval = options?.interval ?? 200; // check every 200ms
  const partial = options?.partial ?? false;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const currentUrl = await adapter.getCurrentUrl?.();
    if (!currentUrl) continue;

    const matched = partial
      ? currentUrl.includes(expected)
      : currentUrl === expected;
    if (matched) return true;

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(
    `Timeout: Expected URL to ${partial ? "contain" : "be"} "${expected}"`
  );
}
