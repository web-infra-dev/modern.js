import assert from 'assert';
import * as path from 'path';
import { readFileSync } from 'fs';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';
import { webpackOnlyTest } from '../../scripts/helper';

webpackOnlyTest('should run SWC compilation correctly', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [builderPluginSwc()],
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate('window.student')).toEqual({
    name: 'xxx',
    age: 10,
    school: 'yyy',
  });
});

webpackOnlyTest('should optimize lodash bundle size', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [builderPluginSwc()],
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  const files = await builder.unwrapOutputJSON();
  const lodashBundle = Object.keys(files).find(file =>
    file.includes('lib-lodash'),
  );

  assert(lodashBundle);

  const bundleSize = readFileSync(lodashBundle, 'utf-8').length / 1024;

  expect(bundleSize < 10).toBeTruthy();
});
