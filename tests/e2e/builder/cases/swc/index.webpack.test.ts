import assert from 'assert';
import * as path from 'path';
import { readFileSync } from 'fs';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

test('should run SWC compilation correctly', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [builderPluginSwc()],
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate('window.student')).toEqual({
    name: 'xxx',
    age: 10,
    school: 'yyy',
  });

  builder.close();
});

test('should optimize lodash bundle size', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [builderPluginSwc()],
    runServer: true,
    builderConfig: {
      output: {
        polyfill: 'entry',
      },
    },
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  const files = await builder.unwrapOutputJSON();
  const lodashBundle = Object.keys(files).find(file =>
    file.includes('lib-lodash'),
  );

  assert(lodashBundle);

  const bundleSize = readFileSync(lodashBundle, 'utf-8').length / 1024;

  expect(bundleSize < 10).toBeTruthy();

  builder.close();
});
