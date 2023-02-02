import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = resolve(__dirname, '../');

allProviderTest('resolve-extension-prefix', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
  };

  // ex.js take effect when not set resolveExtensionPrefix
  let builder = await build(buildOpts);
  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

  builder.close();

  // ex.web.js take effect when set resolveExtensionPrefix
  builder = await build(buildOpts, {
    source: {
      resolveExtensionPrefix: '.web',
    },
  });
  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(page.innerHTML('#test-el')).resolves.toBe('web');

  builder.close();
});
