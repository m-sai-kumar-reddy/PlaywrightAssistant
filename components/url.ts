import {
  navigate,
  getCurrentUrl,
  interceptAllRequestsWithToken,
} from "../core/engine/index.ts";

interface UrlProps {
  url: string;
  expected?: string; // optionally check that current url matches this
  partialMatch?: boolean; // if true, checks if actual URL includes expected
  timeoutMs?: number; // optional custom timeout
  intervalMs?: number; // optional retry interval
  bearerToken?: string;
}

export async function testUrl({
  url,
  expected,
  partialMatch = false,
  timeoutMs = 5000,
  intervalMs = 250,
  bearerToken,
}: UrlProps) {
  if (bearerToken) {
    await interceptAllRequestsWithToken(bearerToken);
  }
  await navigate(url);

  if (expected) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const actual = await getCurrentUrl();

      const matched = partialMatch
        ? actual.includes(expected)
        : actual === expected;

      if (matched) {
        console.log(
          `✅ Navigated to expected URL: ${expected} ${
            partialMatch ? "(partial match)" : ""
          }`
        );
        return;
      }

      await new Promise((res) => setTimeout(res, intervalMs));
    }

    // Timeout reached, still no match
    const finalUrl = await getCurrentUrl();
    console.error(
      `❌ URL mismatch after ${timeoutMs}ms:\nExpected ${
        partialMatch ? "to include" : "to equal"
      }: "${expected}"\nGot: "${finalUrl}"`
    );
  } else {
    console.log(`✅ Navigated to ${url}`);
  }
}
