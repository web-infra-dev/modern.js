import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = __dirname;

test('tools.rspack', async ({ page }, testInfo) => {
  const builder = await build({
    cwd: join(fixtures, 'source/global-vars'),
    entry: {
      main: join(fixtures, 'source/global-vars/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      output: {
        distPath: {
          root: testInfo.outputPath('dist'),
        },
      },
      source: {
        define: {
          ENABLE_TEST: JSON.stringify(true),
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  builder.close();
});
