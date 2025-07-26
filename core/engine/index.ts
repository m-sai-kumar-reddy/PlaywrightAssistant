import { pathToFileURL } from "url";
import config from "../../config/test.config.ts";
import type { TestAdapter } from "./adapter.ts";

let _adapter: TestAdapter | null = null;
let _initialized = false;

/** Called by each adapter’s own init() to register itself */
export function setAdapter(adapter: TestAdapter) {
  _adapter = adapter;
}

async function initAdapter() {
  if (_initialized) return;

  const runnerKey = process.env.TEST_ENV || process.argv[2];
  if (!runnerKey) {
    throw new Error(
      `❌  No runner provided. Use TEST_ENV or pass the runner name as first CLI arg.\n` +
        `Available: ${Object.keys(config.runners).join(", ")}`
    );
  }

  const runner = config.runners[runnerKey];
  if (!runner) {
    throw new Error(
      `❌  Unknown runner "${runnerKey}". Available: ${Object.keys(
        config.runners
      ).join(", ")}`
    );
  }

  const adapterURL = pathToFileURL(runner.adapter).href;
  const mod = await import(adapterURL);

  if (typeof mod.init !== "function") {
    throw new Error(
      `Adapter module "${runner.adapter}" has no async init() export.`
    );
  }

  await mod.init();

  if (!_adapter) {
    throw new Error(`Adapter did not call setAdapter() in its init().`);
  }

  _initialized = true;
}

function ensureAdapter(): TestAdapter {
  if (!_adapter) {
    throw new Error(
      "TestAdapter not set! Did your adapter.init() call setAdapter()?"
    );
  }
  return _adapter;
}
export { ensureAdapter };

// ——————————————
// Wrapped primitives (delegated to adapter)
// ——————————————

export async function click(selector: string) {
  await initAdapter();
  return ensureAdapter().click(selector);
}

export async function fill(selector: string, value: string) {
  await initAdapter();
  return ensureAdapter().fill(selector, value);
}

export async function getText(selector: string): Promise<string> {
  await initAdapter();
  return ensureAdapter().getText(selector);
}

export async function getAttribute(
  selector: string,
  name: string
): Promise<string | null> {
  await initAdapter();
  return ensureAdapter().getAttribute(selector, name);
}

export async function getStyle(
  selector: string,
  prop: string
): Promise<string> {
  await initAdapter();
  return ensureAdapter().getStyle(selector, prop);
}

export async function getValue(selector: string): Promise<string> {
  await initAdapter();
  return ensureAdapter().getValue(selector);
}

export async function navigate(url: string) {
  await initAdapter();
  return ensureAdapter().navigate(url);
}

export async function getCurrentUrl(): Promise<string> {
  await initAdapter();
  return ensureAdapter().getCurrentUrl();
}

// ———————————————————————
// 🆕 Add these three utility methods
// ———————————————————————

/**
 * Waits for a selector to appear.
 */
export async function waitForSelector(selector: string, timeout = 5000) {
  await initAdapter();
  return ensureAdapter().waitForSelector(selector, timeout);
}

/**
 * Sleeps for the specified duration.
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns content inside an iframe.
 */
export async function getFrameContent(
  frameSelector: string,
  contentSelector: string
): Promise<string> {
  await initAdapter();
  return ensureAdapter().getFrameContent(frameSelector, contentSelector);
}

export async function interceptNetwork(options: {
  url: string | RegExp;
  method?: string;
  status?: number;
  contentType?: string;
  mockData: any;
}) {
  await initAdapter();
  return ensureAdapter().interceptNetwork(options);
}

export async function interceptAllRequestsWithToken(token?: string) {
  await initAdapter();
  return ensureAdapter().interceptNetwork({
    url: /.*/, // intercept all requests
    method: undefined, // catch all methods
    status: 200,
    contentType: "application/json",
    mockData: {}, // empty but will allow passthrough/mocking
    injectHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
}
