import { ensureAdapter } from "../core/engine/index";

/**
 * Waits for a selector to be visible in the DOM.
 */
export async function waitForSelectorToBeVisible(
  selector: string,
  timeout = 5000
) {
  const adapter = ensureAdapter();

  // This assumes the adapter has a `.page` property (like in Playwright)
  const page = (adapter as any).page;
  if (!page) throw new Error("Adapter does not expose 'page'");

  await page.waitForSelector(selector, { state: "visible", timeout });
}
