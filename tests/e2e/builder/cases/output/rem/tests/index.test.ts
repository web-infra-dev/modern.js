import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = resolve(__dirname, '../');

allProviderTest('rem default (disable)', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    output: {},
  });
  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('20px');

  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('description')).fontSize`,
    ),
  ).resolves.toBe('16px');

  builder.close();
});

allProviderTest('rem enable', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
  };

  // convert to rem
  const builder = await build(buildOpts, {
    output: {
      convertToRem: true,
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate('document.documentElement.style.fontSize'),
  ).resolves.toBe('64px');

  // less convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('25.6px');

  // scss convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('header')).fontSize`,
    ),
  ).resolves.toBe('25.6px');

  // css convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('description')).fontSize`,
    ),
  ).resolves.toBe('20.48px');

  builder.close();
});
