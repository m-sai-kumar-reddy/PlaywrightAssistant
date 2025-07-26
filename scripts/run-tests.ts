import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import config from "../config/test.config.js";

function showUsage() {
  console.error("Usage: npm run test <runner> <test-file>");
  console.error("Available runners:", Object.keys(config.runners).join(", "));
  process.exit(1);
}

const runnerKey = process.argv[2];
const fileArg = process.argv[3];

if (!runnerKey || !fileArg) {
  console.error("❌  Runner or test file not specified.");
  showUsage();
}

const runner = config.runners[runnerKey];
const adapterPath = path.resolve(`adapters/${runnerKey}/index.ts`);
if (!runner) {
  console.error(`❌  Unknown runner "${runnerKey}"`);
  showUsage();
}

// Resolve test file
const locationsToCheck = [
  path.join("tests", runnerKey),
  path.join("pages", runnerKey),
  "pages", // fallback location
];

const extensions = [".ts", ".js"];
let resolvedFilePath = null;

for (const location of locationsToCheck) {
  for (const ext of extensions) {
    const filePath = path.resolve(`${location}/${fileArg}${ext}`);
    if (fs.existsSync(filePath)) {
      resolvedFilePath = filePath;
      break;
    }
  }
  if (resolvedFilePath) break;
}

if (!resolvedFilePath) {
  console.error(`❌ Could not find test file: ${fileArg} in any of:`);
  locationsToCheck.forEach((loc) => console.error(`- ${loc}`));
  process.exit(1);
}

console.log(`🚀 Launching ${runnerKey}: ${resolvedFilePath}`);

(async () => {
  try {
    // 1. Load and init the adapter
    if (!fs.existsSync(adapterPath)) {
      throw new Error(`Adapter not found at ${adapterPath}`);
    }

    const { init } = await import(pathToFileURL(adapterPath).href);
    if (typeof init !== "function") {
      throw new Error(`'init' function not exported from ${adapterPath}`);
    }

    await init(); // ✅ this sets the adapter via setAdapter()

    // 2. Dynamically import the test file
    const module = await import(pathToFileURL(resolvedFilePath).href);
    const functionName = `test${fileArg
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, (c) => c.toUpperCase())}`;

    const testFn = module[functionName];
    if (typeof testFn !== "function") {
      throw new Error(
        `Function "${functionName}" not found in ${resolvedFilePath}`
      );
    }

    await testFn(); // 🚀 Run the test
    console.log("✅ Test completed successfully.");
  } catch (err) {
    console.error("❌ Test execution failed:");
    console.error(err);
    process.exit(1);
  }
})();
