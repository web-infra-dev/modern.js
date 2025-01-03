import path from 'path';
import { fixtures, launchAppWithPage } from './utils';

describe('use tailwindcss without modern plugin', () => {
  test(`should load tailwind & tailwind.config.js correctly`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-without-plugin');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(31, 182, 255)');

    await clear();
  });
});
