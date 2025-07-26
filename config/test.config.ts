import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

export interface RunnerConfig {
  cmd: string; // binary to exec (e.g. "npx")
  args: string[]; // base args (e.g. ["playwright", "test"])
  cwd?: string; // optional working directory
  adapter: string; // where to find the adapter’s file
}

export interface TestConfig {
  // defaultRunner: string; // you can uncomment this to set a fallback runner
  runners: Record<string, RunnerConfig>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");

const config = {
  runners: {
    playwright: {
      cmd: "npx",
      args: ["playwright", "test"],
      adapter: path.resolve(ROOT, "adapters/playwright/index.ts"),
    },
    cucumber: {
      cmd: "npx",
      args: ["cucumber-js"],
      adapter: path.resolve(ROOT, "adapters/cucumber/index.ts"),
    },
    gherkin: {
      cmd: "npx",
      args: ["gherkin", "--require", "config/gherkin-lint.json"],
      adapter: path.resolve(ROOT, "core/adapters/gherkin/index.ts"),
    },
  },
};

export default config;
