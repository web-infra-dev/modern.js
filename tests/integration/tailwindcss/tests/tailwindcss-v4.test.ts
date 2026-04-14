import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, launchAppWithPage } from './utils';

rstest.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });

describe('use tailwindcss v4', () => {
  test('should build successfully with tailwindcss v4 baseline fixture', async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v4');

    const buildResult = await modernBuild(appDir, [], {});

    expect(buildResult.code).toBe(0);
  });

  test('should serve successfully with tailwindcss v4 baseline fixture', async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v4');

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

  test('should build and serve successfully with tailwindcss v4 tsconfig paths', async () => {
    const appDir = path.resolve(fixtures, 'tailwindcss-v4-tsconfig');

    const buildResult = await modernBuild(appDir, [], {});

    expect(buildResult.code).toBe(0);

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
