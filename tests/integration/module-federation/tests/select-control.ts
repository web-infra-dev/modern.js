import type { Page } from 'puppeteer';

export async function selectControl(
  page: Page,
  selector: string,
  value: string,
) {
  await page.click(selector.replace(/^select/, ''));
  const option = `[role="option"][data-value=${JSON.stringify(value)}]`;
  await page.waitForSelector(option, { visible: true });
  await page.click(option);
}
