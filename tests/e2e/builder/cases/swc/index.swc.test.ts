import assert from 'assert';
import * as path from 'path';
import { readFileSync } from 'fs';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginSwc } from '@rsbuild/plugin-swc';

test('should run SWC compilation correctly', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [pluginSwc()],
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate('window.student')).toEqual({
    name: 'xxx',
    id: 1,
    age: 10,
    school: 'yyy',
  });

  await builder.close();
});

test('should optimize lodash bundle size', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [pluginSwc()],
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

  await builder.close();
});

test('should use define for class', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [
      pluginSwc({
        overrides: [
          {
            test: /override.ts/,
            jsc: {
              transform: {
                useDefineForClassFields: false,
              },
            },
          },
        ],
        jsc: {
          transform: {
            useDefineForClassFields: true,
          },
        },
      }),
    ],
    builderConfig: {
      output: {
        disableMinimize: true,
      },
    },
    runServer: true,
  });

  const { content: file } = await builder.getIndexFile();

  // this is because setting useDefineForClassFields to false
  expect(file.includes('this.bar = 1')).toBe(true);

  // should not affect normal modules
  expect(
    file.includes('_define_property(_assert_this_initialized(_this), "id", 1)'),
  ).toBe(true);

  await builder.close();
});

test('core-js-entry', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/core-js-entry.ts'),
    },
    plugins: [
      pluginSwc({
        env: {
          targets: 'ie 9',
          mode: 'entry',
        },
      }),
    ],
    builderConfig: {
      output: {
        disableMinimize: true,
      },
    },
    runServer: true,
  });

  await builder.close();
});

test('core-js-usage', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/core-js-usage.ts'),
    },
    plugins: [
      pluginSwc({
        env: {
          targets: 'ie 9',
          mode: 'usage',
        },
      }),
    ],
    builderConfig: {
      output: {
        disableMinimize: true,
      },
    },
    runServer: true,
  });

  await builder.close();
});
