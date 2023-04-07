import type { Page } from 'puppeteer';

export const supportSSR = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/four`);
  const html = await page.content();
  expect(html).toMatch('src/App.tsx');
  expect(errors.length).toEqual(0);
};
