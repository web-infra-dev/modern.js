import * as path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';
import { webpackOnlyTest } from '../../scripts/helper';

webpackOnlyTest('swc', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    plugins: [builderPluginSwc()],
  });

  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate('window.student')).toEqual({
    name: 'xxx',
    age: 10,
    school: 'yyy',
  });
});
