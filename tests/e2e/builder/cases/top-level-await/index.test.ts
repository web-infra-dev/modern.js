import * as path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '../../scripts/helper';

webpackOnlyTest('should run top level await correctly', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate('window.foo')).toEqual('hello');

  builder.close();
});
