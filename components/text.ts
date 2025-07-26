import { ensureAdapter } from "../core/engine/index.ts";

interface TextTestOptions {
  selector: string;
  expectedText?: string;
  partialMatch?: boolean;
  visible?: boolean;
  timeoutMs?: number;
  intervalMs?: number;
  onMismatch?: (actual: string, expected?: string) => void;
}

/**
 * Validate text content inside a selector with options for match style and visibility.
 */
export async function testText({
  selector,
  expectedText,
  partialMatch = false,
  visible = true,
  timeoutMs = 5000,
  intervalMs = 250,
  onMismatch,
}: TextTestOptions) {
  const adapter = ensureAdapter();

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const isVisible = await adapter.isVisible(selector);
      const content = await adapter.getTextContent(selector);

      const visibilityPass = visible === isVisible;
      const matchPass =
        expectedText == null
          ? true
          : partialMatch
          ? content.includes(expectedText)
          : content === expectedText;

      if (visibilityPass && matchPass) {
        console.log(
          `✅ Text match for ${selector}: "${
            expectedText ?? "(no expected text)"
          }"`
        );
        return;
      }
    } catch (_) {
      // Might not be in DOM yet; retry
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  const finalContent = await adapter
    .getTextContent(selector)
    .catch(() => "(unavailable)");
  const errorMsg = `❌ Text mismatch for selector "${selector}" after ${timeoutMs}ms\nExpected ${
    partialMatch ? "to include" : "to equal"
  }: "${expectedText}"\nGot: "${finalContent}"`;

  if (onMismatch) onMismatch(finalContent, expectedText);
  else console.error(errorMsg);

  throw new Error(errorMsg);
}
