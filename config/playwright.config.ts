import { defineConfig } from "@playwright/test";
import path from "path";

// Get the test directory from env (default to 'pages')
const testDir = process.env.TEST_DIR || "pages";

export default defineConfig({
  testDir: path.resolve(__dirname, testDir),
  timeout: 30 * 1000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html"]],
});
