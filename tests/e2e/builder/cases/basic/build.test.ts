import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

test('basic', async ({ page }) => {
  // TODO: serve dist files from memfs directly (instead of output files to disk first).
  // TODO: re-organize builtin plugins so that we can setup plugins by `plugins: 'minimal'` or `plugins: ['react']`.
  // TODO: display all files in 404 page.
  // TODO: disable output when testing.
  // TODO: is it possible to merge coverages with vitest.
  // TODO: is it possible to integrate with vitest.
  // TODO: snapshot of dom tree.
  // TODO: assert console output.
  // TODO: docs.
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });

  await page.goto(getHrefByEntryName('index', builder.port));
  expect(await page.evaluate('window.answer')).toBe(42);
  await page.evaluate('document.write(window.answer)');
  expect(await page.screenshot()).toMatchSnapshot();
});
