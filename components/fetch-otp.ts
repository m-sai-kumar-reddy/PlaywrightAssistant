import {
  navigate,
  waitForSelector,
  getFrameContent,
  fill,
  click,
  delay,
} from "../core/engine";

export interface FetchOtpProps {
  url: string; // Inbox page URL (can include query params like ?login=email)
  mailId?: string; // Optional mailId
  password?: string; // Optional password (if login is needed)
  digits?: number; // OTP digit length, default = 6
}

/**
 * Fetches the OTP code from a web-based inbox page.
 * Supports optional password-based login.
 */
export async function fetchOtp({
  url,
  mailId,
  password,
  digits = 6,
}: FetchOtpProps): Promise<string | null> {
  const otpRegex = new RegExp(`\\b\\d{${digits}}\\b`);

  await navigate(url);

  if (mailId) {
    await waitForSelector("#login");
    await fill("#login", mailId);
    await delay(500);
    await click("#refreshbut button");
  }

  // If password is provided, try to log in
  if (password) {
    await waitForSelector("#password");
    await fill("#password", password);
    await click("button[type='submit']");
    await delay(1000); // optional: wait for inbox to load
  }

  // Wait for email iframe to appear
  await waitForSelector("#ifmail");

  // Read email body from iframe
  const content = await getFrameContent("#ifmail", "body");
  const match = content.match(otpRegex);

  return match ? match[0] : null;
}
