import path from 'path';
import { fixtures, launchAppWithPage } from './utils';

rstest.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });

describe('use tailwindcss v4', () => {
  test(`should show style by use tailwindcss theme`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v4-tools');
    const { page, clear } = await launchAppWithPage(appDir);
    try {
      const primaryColorElement = await page.waitForSelector('.bg-primary');
      const backgroundColor = await page.evaluate(element => {
        const style = window.getComputedStyle(element);
        return style.backgroundColor;
      }, primaryColorElement);

      expect(backgroundColor).toMatch(/rgb\(0, 0, 255\)|#0000ff|blue/i);
    } finally {
      await clear();
    }
  });
});
