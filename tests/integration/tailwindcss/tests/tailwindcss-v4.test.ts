import path from 'path';
import { fixtures, launchAppWithPage } from './utils';

describe('use tailwindcss v4', () => {
  test(`should show style by use tailwindcss theme`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v4');
    const { page, clear } = await launchAppWithPage(appDir);
    const primaryColorElement = await page.waitForSelector('.bg-primary');
    const backgroundColor = await page.evaluate(element => {
      const style = window.getComputedStyle(element);
      return style.backgroundColor;
    }, primaryColorElement);

    expect(backgroundColor).toMatch(/rgb\(0, 0, 255\)|#0000ff|blue/i);

    await clear();
  });
});
