import {
  delay,
  fill,
  getAttribute,
  getStyle,
  getValue,
} from "../core/engine/index.ts";

interface InputProps {
  selector: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  styles?: Record<string, string>;
  expected: {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    type?: string;
    styles?: Record<string, string>;
  };
}

export async function testInput(props: InputProps) {
  const { selector, value, placeholder, disabled, type, styles, expected } =
    props;

  if (value !== undefined) {
    await fill(selector, value);
  }

  const mismatches: string[] = [];

  if (expected.placeholder) {
    const actual = await getAttribute(selector, "placeholder");
    if (actual !== expected.placeholder) {
      mismatches.push(
        `placeholder mismatch: expected "${expected.placeholder}", got "${actual}"`
      );
    }
  }

  if (expected.disabled !== undefined) {
    const actual = await getAttribute(selector, "disabled");
    const actualDisabled = actual !== null;
    if (actualDisabled !== expected.disabled) {
      mismatches.push(
        `disabled mismatch: expected ${expected.disabled}, got ${actualDisabled}`
      );
    }
  }

  if (expected.type) {
    const actual = await getAttribute(selector, "type");
    if (actual !== expected.type) {
      mismatches.push(
        `type mismatch: expected "${expected.type}", got "${actual}"`
      );
    }
  }

  if (expected.value) {
    let actual = await getValue(selector);

    if (actual !== expected.value) {
      // Retry once after a small delay
      await fill(selector, value ?? expected.value);
      await delay(200);
      actual = await getValue(selector);
    }

    if (actual !== expected.value) {
      mismatches.push(
        `value mismatch: expected "${expected.value}", got "${actual}"`
      );
    }
  }

  if (expected.styles) {
    for (const [key, val] of Object.entries(expected.styles)) {
      const actual = await getStyle(selector, key);
      if (actual !== val) {
        mismatches.push(
          `style mismatch for "${key}": expected "${val}", got "${actual}"`
        );
      }
    }
  }

  if (mismatches.length) {
    console.error(`❌ Input test failed for ${selector}:`);
    for (const msg of mismatches) {
      console.error("  - " + msg);
    }
  } else {
    console.log(`✅ Input test passed for ${selector}`);
  }
}
