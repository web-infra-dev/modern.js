import { join } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

const fixtures = __dirname;

// TODO: needs builtin:swc-loader
webpackOnlyTest('should remove prop-types by default', async ({ page }) => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
    runServer: true,
  });
  await page.goto(getHrefByEntryName('main', builder.port));

  expect(await page.evaluate('window.testAppPropTypes')).toBeUndefined();
  builder.close();
});
