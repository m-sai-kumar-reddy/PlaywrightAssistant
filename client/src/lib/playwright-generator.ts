import { TestScenario } from "@shared/schema";

export function generatePlaywrightCode(baseUrl: string, testScenario: TestScenario): string {
  return `// Generated Playwright Test
import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

class ManualVerificationHandler {
  private browser: Browser;
  private context: BrowserContext;
  
  constructor(browser: Browser, context: BrowserContext) {
    this.browser = browser;
    this.context = context;
  }
  
  async handleVerification(page: Page): Promise<void> {
    // Open new tab for manual verification
    const verificationPage = await this.context.newPage();
    await verificationPage.goto(page.url());
    
    console.log('Manual verification required...');
    console.log('Please complete verification in new tab');
    
    // Wait for verification completion
    await this.waitForVerificationComplete(verificationPage);
    await verificationPage.close();
  }
  
  private async waitForVerificationComplete(page: Page): Promise<void> {
    // Implementation for waiting verification
    await page.waitForSelector('[data-verified="true"]', { 
      timeout: 300000 
    });
  }
}

${testScenario.scenarios.map((scenario) => `
test('${scenario.name}', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const verificationHandler = new ManualVerificationHandler(browser, context);
  
  ${scenario.steps.map((step) => {
    switch (step.action) {
      case 'navigate':
        return `  await page.goto('${baseUrl}${step.url}');`;
      case 'fill':
        return `  await page.fill('${step.selector}', '${step.value}');`;
      case 'click':
        return `  await page.click('${step.selector}');`;
      case 'waitForSelector':
        const verificationCheck = step.humanVerification 
          ? `
  // Check for human verification
  const captchaPresent = await page.locator('[data-captcha]').isVisible();
  if (captchaPresent) {
    await verificationHandler.handleVerification(page);
  }`
          : '';
        return `  await page.waitForSelector('${step.selector}');${verificationCheck}`;
      case 'expect':
        return `  await expect(page.locator('${step.selector}')).toBeVisible();`;
      default:
        return `  // Unknown action: ${step.action}`;
    }
  }).join('\n')}
  
  await context.close();
});`).join('\n')}`;
}
