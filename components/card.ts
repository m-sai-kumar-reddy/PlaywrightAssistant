import { ensureAdapter } from "../core/engine/index.ts";

interface CardTestOptions {
  selector: string;
  expectedTitle?: string;
  visible?: boolean;
  timeoutMs?: number;
  intervalMs?: number;
  onMismatch?: (details: { actualTitle?: string; visible: boolean }) => void;
}

/**
 * Validate a card component for title text and visibility.
 */
export async function testCard({
  selector,
  expectedTitle,
  visible = true,
  timeoutMs = 5000,
  intervalMs = 250,
  onMismatch,
}: CardTestOptions) {
  const adapter = ensureAdapter();

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const isVisible = await adapter.isVisible(selector);
      const title = await adapter.getTextContent(
        `${selector} h2, ${selector} .card-title`
      );

      const visibilityPass = isVisible === visible;
      const titlePass =
        expectedTitle == null ? true : title?.trim() === expectedTitle.trim();

      if (visibilityPass && titlePass) {
        console.log(`✅ Card "${selector}" validated successfully.`);
        return;
      }
    } catch (_) {
      // Retry if DOM isn't ready
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  const actualTitle = await adapter
    .getTextContent(`${selector} h2, ${selector} .card-title`)
    .catch(() => "(unavailable)");
  const errorMsg = `❌ Card validation failed for selector "${selector}" after ${timeoutMs}ms\nExpected Title: "${expectedTitle}"\nActual Title: "${actualTitle}"`;

  if (onMismatch) onMismatch({ actualTitle, visible });
  else console.error(errorMsg);

  throw new Error(errorMsg);
}
