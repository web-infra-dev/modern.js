import { join } from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should serve dist files correctly', async ({ page }) => {
  const cwd = join(__dirname, 'basic');

  const { instance } = await build({
    cwd,
    useUniBuilder: false,
    entry: {
      main: join(cwd, 'src/index.js'),
    },
  });

  // @ts-expect-error
  const { port, server } = await instance.serve();

  await page.goto(getHrefByEntryName('main', port));

  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Builder!');

  await server.close();

  await fs.remove(join(cwd, 'dist-1'));
});
