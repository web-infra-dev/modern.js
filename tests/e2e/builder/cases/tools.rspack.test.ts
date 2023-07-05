import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = __dirname;

test('tools.rspack', async ({ page }) => {
  const builder = await build<'rspack'>({
    cwd: join(fixtures, 'source/global-vars'),
    entry: {
      main: join(fixtures, 'source/global-vars/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        rspack: config => {
          config.builtins!.define = {
            ...(config.builtins!.define || {}),
            ENABLE_TEST: JSON.stringify(true),
          };
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(
    page.evaluate(`document.getElementById('test-el').innerHTML`),
  ).resolves.toBe('aaaaa');

  builder.close();
});
