import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, dev, getHrefByEntryName } from '@scripts/shared';

test('multi compiler build', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: { main: path.resolve(__dirname, 'src/index.js') },
    target: ['web', 'node'],
    runServer: true,
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Builder!');

  builder.close();
});

test('multi compiler dev', async ({ page }) => {
  const builder = await dev({
    cwd: __dirname,
    entry: { main: path.resolve(__dirname, 'src/index.js') },
    target: ['web', 'node'],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Builder!');

  await builder.server.close();
});
