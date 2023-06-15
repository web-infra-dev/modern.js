import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginVue } from '@modern-js/builder-plugin-vue';

test('should build basic Vue sfc correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-basic');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(
    page.evaluate(`document.querySelector('#button1').innerHTML`),
  ).resolves.toBe('A: 0');
  await expect(
    page.evaluate(`document.querySelector('#button2').innerHTML`),
  ).resolves.toBe('B: 0');

  builder.close();
});
