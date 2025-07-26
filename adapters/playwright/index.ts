import { chromium, Browser, Page } from "playwright";
import { setAdapter } from "../../core/engine/index.ts";
import type { TestAdapter } from "../../core/engine/adapter";

let browser: Browser | null = null;
let page: Page | null = null;

class PlaywrightAdapter implements TestAdapter {
  async init() {
    if (!browser || !page) {
      browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      page = await context.newPage();
    }

    setAdapter(this);
  }

  async click(sel: string) {
    return page!.click(sel);
  }

  async fill(sel: string, val: string) {
    return page!.fill(sel, val);
  }

  async getText(sel: string): Promise<string> {
    const text = await page!.textContent(sel);
    return text ?? "";
  }

  async getAttribute(sel: string, attr: string) {
    return page!.getAttribute(sel, attr);
  }

  getValue(selector: string): Promise<string> {
    return page!.$eval(selector, (el) => (el as HTMLInputElement).value);
  }

  async getStyle(sel: string, prop: string) {
    return page!.$eval(
      sel,
      (el, prop) => getComputedStyle(el as Element).getPropertyValue(prop),
      prop
    );
  }

  async getCurrentUrl() {
    return page!.url();
  }

  async navigate(url: string) {
    await page!.goto(url);
  }

  async waitForSelector(selector: string, timeout = 5000) {
    return await page!.waitForSelector(selector, { timeout });
  }

  async getFrameContent(frameSelector: string, contentSelector: string) {
    const frameHandle = await page!.waitForSelector(frameSelector);
    const frame = await frameHandle.contentFrame();
    if (!frame) throw new Error(`Frame "${frameSelector}" not found`);

    const contentHandle = await frame.waitForSelector(contentSelector);
    return await contentHandle.innerText();
  }

  async close() {
    await browser?.close();
    browser = null;
    page = null;
  }

  async handleCaptchaPlaywright(): Promise<void> {
    console.log("Waiting for CAPTCHA to be solved manually...");
    await page!.waitForSelector(".captcha-solved", { timeout: 60000 }); // Change to an actual class that appears after CAPTCHA
  }
  async interceptNetwork({
    url,
    method = "GET",
    status = 200,
    contentType = "application/json",
    mockData,
  }) {
    await page!.route(url, async (route, request) => {
      if (request.method() === method) {
        route.fulfill({
          status,
          contentType,
          body: JSON.stringify(mockData),
        });
      } else {
        route.continue();
      }
    });
  }
  async isVisible(selector: string): Promise<boolean> {
    const element = await page!.$(selector);
    return element ? await element.isVisible() : false;
  }

  async getTextContent(selector: string): Promise<string> {
    const element = await page!.$(selector);
    return element ? (await element.textContent()) || "" : "";
  }
}

const adapter = new PlaywrightAdapter();

export async function init() {
  await adapter.init();
}

export async function teardown() {
  await adapter.close();
}

export function getAdapter(): TestAdapter {
  return adapter;
}
