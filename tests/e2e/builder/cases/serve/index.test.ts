import { join } from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should serve dist files correctly', async ({ page }) => {
  const cwd = join(__dirname, 'basic');
  const buildOpts = {
    cwd,
    entry: {
      main: join(cwd, 'src/index.js'),
    },
  };

  const { instance } = await build(buildOpts, {}, false);

  const { port, server } = await instance.serve();

  await page.goto(getHrefByEntryName('main', port));

  await expect(
    page.evaluate(`document.getElementById('root').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await server.close();

  await fs.remove(join(cwd, 'dist-1'));
});
