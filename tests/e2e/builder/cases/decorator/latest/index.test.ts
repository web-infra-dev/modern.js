import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

test('decorator latest', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    runServer: true,
    builderConfig: {
      output: {
        enableLatestDecorators: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('index', builder.port));
  expect(await page.evaluate('window.aaa')).toBe('hello world');

  // swc...
  if (builder.providerType !== 'rspack') {
    expect(await page.evaluate('window.bbb')).toContain(
      "Cannot assign to read only property 'message' of object",
    );

    expect(await page.evaluate('window.ccc')).toContain(
      "Cannot assign to read only property 'message' of object",
    );
  }

  builder.close();
});
