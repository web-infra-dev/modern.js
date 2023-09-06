import path from 'path';
import { fixtures, launchAppWithPage } from './utils';

describe('use twin.macro v2', () => {
  test(`should show style by use tailwindcss theme when use twin.macro v2`, async () => {
    const appDir = path.resolve(fixtures, 'twin.macro-v2');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(255, 0, 0)');

    await clear();
  });
});
