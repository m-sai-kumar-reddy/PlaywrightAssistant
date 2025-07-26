import { handleCaptchaCucumber } from "./cucumber-captcha";
import { handleCaptchaGherkin } from "./gherkin-captcha";
import { handleCaptchaPlaywright } from "./playwright-captcha";

export async function handleCaptcha(adapterName: string): Promise<void> {
  switch (adapterName) {
    case "playwright":
      return await handleCaptchaPlaywright();
    case "cucumber":
      return await handleCaptchaCucumber();
    case "gherkin":
      return await handleCaptchaGherkin();
    default:
      throw new Error(
        `CAPTCHA handler not implemented for adapter: ${adapterName}`
      );
  }
}
