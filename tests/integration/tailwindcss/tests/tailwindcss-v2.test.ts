import path from 'path';
import { fixtures, launchAppWithPage } from './utils';

describe('use tailwindcss v2', () => {
  test(`should show style by use tailwindcss text-black`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v2');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(239, 68, 68)');

    await clear();
  });
});
