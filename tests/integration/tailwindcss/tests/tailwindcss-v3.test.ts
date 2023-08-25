import path from 'path';
import { fixtures, launchAppWithPage } from './utils';

describe('use tailwindcss v3', () => {
  test(`should show style by use tailwindcss text-black`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v3');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(239, 68, 68)');

    await clear();
  });

  test(`should load tailwind.config.js correctly`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v3-js-config');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(31, 182, 255)');

    await clear();
  });

  test(`should load tailwind.config.ts correctly`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v3-ts-config');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(31, 182, 255)');

    await clear();
  });

  test(`should merge tailwind config correctly`, async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v3-merge-config');
    const { page, clear } = await launchAppWithPage(appDir);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(0, 128, 0)');

    await clear();
  });
});
