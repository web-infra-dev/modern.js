import type { Page } from 'puppeteer';

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function matchesExpected(text: string, expected: RegExp | string) {
  if (expected instanceof RegExp) {
    return expected.test(text);
  }

  return text.includes(expected);
}

export async function expectPageToMatchTextContent(
  page: Page,
  expected: RegExp | string,
  options: {
    timeout?: number;
    interval?: number;
  } = {},
) {
  const timeout = options.timeout ?? 30_000;
  const interval = options.interval ?? 100;
  const deadline = Date.now() + timeout;

  let lastText = '';

  while (Date.now() <= deadline) {
    lastText = normalizeText(
      await page.evaluate(() => document.body?.textContent ?? ''),
    );

    if (matchesExpected(lastText, expected)) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(
    `Timed out waiting for page text to match ${String(expected)}. Last text: ${lastText}`,
  );
}
