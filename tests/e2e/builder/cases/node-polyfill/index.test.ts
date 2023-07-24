import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginNodePolyfill } from '@modern-js/builder-plugin-node-polyfill';

test('should add node-polyfill when add node-polyfill plugin', async ({
  page,
}) => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: [builderPluginNodePolyfill()],
    runServer: true,
  });
  await page.goto(getHrefByEntryName('index', builder.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Builder!');

  const testBuffer = page.locator('#test-buffer');
  await expect(testBuffer).toHaveText('120120120120');

  const testQueryString = page.locator('#test-querystring');
  await expect(testQueryString).toHaveText('foo=bar');

  builder.close();
});
