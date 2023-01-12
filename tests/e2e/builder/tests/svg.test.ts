import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';
import { allProviderTest } from './helper';

const fixtures = resolve(__dirname, '../fixtures/output');

allProviderTest('svg (defaultExport url)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'svg'),
    entry: {
      main: join(fixtures, 'svg', 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {});

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  builder.close();
});

allProviderTest('svg (defaultExport component)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'svg-default-export-component'),
    entry: {
      main: join(fixtures, 'svg-default-export-component', 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {
    output: {
      svgDefaultExport: 'component',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  builder.close();
});
