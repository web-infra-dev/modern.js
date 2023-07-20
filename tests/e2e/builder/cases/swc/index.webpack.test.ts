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

  await builder.close();
});

test('should use define for class', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [
      builderPluginSwc({
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

  const files = await builder.unwrapOutputJSON(true);
  const file =
    files[
      Reflect.ownKeys(files).find(
        fileName =>
          (fileName as string).includes('index') &&
          (fileName as string).endsWith('.js'),
      ) as string
    ];

  // this is because setting useDefineForClassFields to false
  expect(file.includes('this.bar = 1')).toBe(true);

  // should not affect normal modules
  expect(
    file.includes('_define_property(_assert_this_initialized(_this), "id", 1)'),
  ).toBe(true);

  await builder.close();
});
