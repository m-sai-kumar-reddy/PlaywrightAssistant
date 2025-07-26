import { testInput } from "../../components/input.js";
import { testButton } from "../../components/button.js";
import { testUrl } from "../../components/url.js";
import { click, ensureAdapter } from "../../core/engine/index.js";
import { fetchOtp } from "../../components/fetch-otp.js";

export async function testLoginPage() {
  await testUrl({
    url: "https://ppr.ecostruxure-energy-access-expert.se.app/",
    expected: "https://idp-int.se.com/u/login",
    partialMatch: true,
    timeoutMs: 7000,
  });

  const adapter = ensureAdapter();

  await adapter.waitForSelectorToBeVisible?.("#username-label", 100000);

  await testInput({
    selector: "#username",
    value: "newgentestuser01@yopmail.com",
    expected: {
      type: "text",
      value: "newgentestuser01@yopmail.com",
    },
  });

  await testButton({
    selector: "._button-login-id",
    expected: {
      label: "Continue",
      type: "submit",
    },
  });

  await click("._button-login-id");

  await testInput({
    selector: "#password",
    value: "Schneider@1234",
    expected: {
      type: "password",
      value: "Schneider@1234",
    },
  });

  await testButton({
    selector: "._button-login-password",
    expected: {
      label: "Continue",
      type: "submit",
      disabled: false,
    },
  });

  await click("._button-login-password");

  await click('button[value="pick-authenticator"]');

  await click('button[aria-label="Email"]');

  const otp = await fetchOtp({
    url: "https://yopmail.com/en",
    mailId: "newgentestuser01@yopmail.com",
  });
  console.log("otp::::::::::::", otp);
}
