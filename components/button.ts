import { getText, getAttribute, getStyle } from "../core/engine/index.ts";

export interface ButtonTestProps {
  selector: string;
  expected: {
    label?: string;
    color?: string;
    disabled?: boolean;
    styles?: Record<string, string>;
    type?: "button" | "submit" | "reset";
  };
}

export async function testButton({
  selector,
  expected,
}: ButtonTestProps): Promise<void> {
  const errors: string[] = [];

  if (expected.label !== undefined) {
    const actual = await getText(selector);
    if (actual !== expected.label) {
      errors.push(`Label: expected "${expected.label}", got "${actual}"`);
    }
  }

  if (expected.type !== undefined) {
    const attr = await getAttribute(selector, "type");
    const actualType = attr ?? "";
    if (actualType !== expected.type) {
      errors.push(`Type: expected "${expected.type}", got "${actualType}"`);
    }
  }

  if (expected.disabled !== undefined) {
    const attr = await getAttribute(selector, "disabled");
    const isDisabled = attr !== null;
    if (isDisabled !== expected.disabled) {
      errors.push(`Disabled: expected ${expected.disabled}, got ${isDisabled}`);
    }
  }

  if (expected.color !== undefined) {
    const actual = await getStyle(selector, "color");
    if (actual !== expected.color) {
      errors.push(`Color: expected "${expected.color}", got "${actual}"`);
    }
  }

  if (expected.styles) {
    for (const [prop, want] of Object.entries(expected.styles)) {
      const got = await getStyle(selector, prop);
      if (got !== want) {
        errors.push(`Style "${prop}": expected "${want}", got "${got}"`);
      }
    }
  }

  if (errors.length) {
    throw new Error(
      `🔴 testButton failed for "${selector}":\n` +
        errors.map((e) => ` • ${e}`).join("\n")
    );
  }
}
