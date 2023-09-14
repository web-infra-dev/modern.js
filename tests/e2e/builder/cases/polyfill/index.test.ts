import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';

const POLYFILL_RE = /\/lib-polyfill/;

const getPolyfillContent = (files: Record<string, string>) => {
  const polyfillFileName = Object.keys(files).find(
    file => POLYFILL_RE.test(file) && file.endsWith('.js.map'),
  );

  const indexFileName = Object.keys(files).find(
    file => file.includes('index') && file.endsWith('.js.map'),
  )!;

  const content = polyfillFileName
    ? files[polyfillFileName]
    : files[indexFileName];
  return content;
};

test('should add polyfill when set polyfill entry (default)', async ({
  page,
}) => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      output: {
        polyfill: 'entry',
      },
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate('window.a')).toEqual([1, 2, 3, 4, 5, 6, [7, 8]]);

  builder.close();

  const files = await builder.unwrapOutputJSON(false);

  const content = getPolyfillContent(files);

  // should polyfill all api
  expect(content.includes('es.array.flat.js')).toBeTruthy();
});

// TODO: needs builtin:swc-loader
webpackOnlyTest(
  'should add polyfill when set polyfill usage',
  async ({ page }) => {
    const builder = await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      builderConfig: {
        output: {
          polyfill: 'usage',
        },
      },
      runServer: true,
    });

    await page.goto(getHrefByEntryName('index', builder.port));

    expect(await page.evaluate('window.a')).toEqual([1, 2, 3, 4, 5, 6, [7, 8]]);

    builder.close();

    const files = await builder.unwrapOutputJSON(false);

    const content = getPolyfillContent(files);

    // should only polyfill some usage api
    expect(content.includes('es.array.flat.js')).toBeTruthy();
    expect(content.includes('String.prototype.trimEnd')).toBeFalsy();
  },
);
