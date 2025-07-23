export function generatePlaywrightCode(baseUrl, testScenario) {
  return `// Generated Playwright Test (JavaScript)
const { test, expect } = require('@playwright/test');

class ManualVerificationHandler {
  constructor(browser, context) {
    this.browser = browser;
    this.context = context;
  }
  
  async handleVerification(page) {
    // Open new tab for manual verification
    const verificationPage = await this.context.newPage();
    await verificationPage.goto(page.url());
    
    console.log('Manual verification required...');
    console.log('Please complete verification in new tab');
    console.log('Browser will remain open for manual intervention');
    
    // Wait for verification completion
    await this.waitForVerificationComplete(verificationPage);
    await verificationPage.close();
  }
  
  async waitForVerificationComplete(page) {
    // Create a promise that resolves when user presses Enter in console
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('\\n🔍 Manual verification required!');
      console.log('📋 Steps:');
      console.log('  1. Complete the verification challenge in the browser tab');
      console.log('  2. Press Enter in this console when done');
      console.log('⏱️  Waiting for your input...');
      
      rl.question('Press Enter after completing verification: ', () => {
        rl.close();
        console.log('✅ Verification completed, continuing automation...');
        resolve();
      });
    });
  }
}

${testScenario.scenarios.map((scenario) => `
test('${scenario.name}', async ({ browser }) => {
  // Keep browser visible for manual intervention
  const context = await browser.newContext({
    headless: false
  });
  const page = await context.newPage();
  const verificationHandler = new ManualVerificationHandler(browser, context);
  
  try {
    ${scenario.steps.map((step) => {
      switch (step.action) {
        case 'navigate':
          return `    console.log('🌐 Navigating to: ${baseUrl}${step.url}');
    await page.goto('${baseUrl}${step.url}');`;
        case 'fill':
          return `    console.log('✏️  Filling field: ${step.selector}');
    await page.fill('${step.selector}', '${step.value}');`;
        case 'click':
          return `    console.log('👆 Clicking: ${step.selector}');
    await page.click('${step.selector}');`;
        case 'waitForSelector':
          const verificationCheck = step.humanVerification 
            ? `
    console.log('⏳ Waiting for: ${step.selector}');
    try {
      // First try automated flow
      await page.waitForSelector('${step.selector}', { timeout: 5000 });
      console.log('✅ Element found automatically');
    } catch (timeoutError) {
      console.log('🚫 Automated flow blocked - checking for verification challenges');
      
      // Check for common verification patterns
      const verificationSelectors = [
        '[data-captcha]', 
        '.captcha', 
        '#captcha',
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]',
        '.cf-challenge-form',
        '[data-cf-challenge]'
      ];
      
      let verificationFound = false;
      for (const selector of verificationSelectors) {
        const element = await page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          console.log(\`🔒 Verification challenge detected: \${selector}\`);
          verificationFound = true;
          break;
        }
      }
      
      if (verificationFound) {
        await verificationHandler.handleVerification(page);
      } else {
        console.log('⚠️  No verification challenge found, but element still not available');
        console.log('🤖 Triggering manual verification anyway');
        await verificationHandler.handleVerification(page);
      }
      
      // After manual intervention, wait for the expected element
      console.log('⏳ Re-checking for target element...');
      await page.waitForSelector('${step.selector}', { timeout: 60000 });
      console.log('✅ Target element now available');
    }`
            : '';
          return `    console.log('⏳ Waiting for: ${step.selector}');
    await page.waitForSelector('${step.selector}');${verificationCheck}`;
        case 'expect':
          return `    console.log('🔍 Verifying: ${step.selector}');
    await expect(page.locator('${step.selector}')).toBeVisible();`;
        default:
          return `    // Unknown action: ${step.action}`;
      }
    }).join('\n')}
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    console.log('🧹 Cleaning up...');
    await context.close();
  }
});`).join('\n')}

// Export configuration for easy customization
module.exports = {
  // Browser settings for manual verification
  use: {
    headless: false,
    slowMo: 1000, // Add delay between actions for better visibility
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  
  // Test timeout settings
  timeout: 300000, // 5 minutes per test
  expect: {
    timeout: 30000 // 30 seconds for assertions
  }
};`;
}