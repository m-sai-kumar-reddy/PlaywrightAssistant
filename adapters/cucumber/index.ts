import { Before } from "@cucumber/cucumber";
import { setAdapter } from "../../core/engine/index.ts";
import type { TestAdapter } from "../../core/engine/adapter";
import { Builder, By, until, WebDriver } from "selenium-webdriver";

class SeleniumAdapter implements TestAdapter {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async navigate(url: string) {
    await this.driver.get(url);
  }

  async click(selector: string) {
    const el = await this.driver.findElement(By.css(selector));
    await el.click();
  }

  async fill(selector: string, value: string) {
    const el = await this.driver.findElement(By.css(selector));
    await el.clear();
    await el.sendKeys(value);
  }

  async getText(selector: string) {
    const el = await this.driver.findElement(By.css(selector));
    return el.getText();
  }

  async getAttribute(selector: string, attr: string) {
    const el = await this.driver.findElement(By.css(selector));
    return await el.getAttribute(attr);
  }

  async getValue(selector: string) {
    const el = await this.driver.findElement(By.css(selector));
    return await el.getAttribute("value");
  }

  async getStyle(selector: string, styleProp: string) {
    const el = await this.driver.findElement(By.css(selector));
    const script = `return window.getComputedStyle(arguments[0]).getPropertyValue('${styleProp}')`;
    return await this.driver.executeScript(script, el);
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async waitForSelector(selector: string, timeout = 5000) {
    const condition = until.elementLocated(By.css(selector));
    await this.driver.wait(condition, timeout);
  }

  async isVisible(selector: string): Promise<boolean> {
    try {
      const el = await this.driver.findElement(By.css(selector));
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async press(selector: string, key: string) {
    const el = await this.driver.findElement(By.css(selector));
    await el.sendKeys(key);
  }

  async evaluate<T>(script: string): Promise<T> {
    return await this.driver.executeScript(script);
  }

  async getFrameContent(frameSelector: string) {
    await this.driver.switchTo().defaultContent(); // reset first
    const frame = await this.driver.findElement(By.css(frameSelector));
    await this.driver.switchTo().frame(frame);
    const body = await this.driver.findElement(By.css("body"));
    return await body.getAttribute("innerHTML");
  }

  async close() {
    await this.driver.quit();
  }

  getPage(): WebDriver {
    return this.driver;
  }

  async handleCaptchaIfPresent() {
    console.warn(
      "⚠️ CAPTCHA detected. Please solve it manually or provide handler."
    );
    // optionally pause or add image detection logic later
  }
}

export default SeleniumAdapter;
