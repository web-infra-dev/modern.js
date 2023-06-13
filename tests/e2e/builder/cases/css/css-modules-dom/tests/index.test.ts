import { join, resolve } from 'path';
import { fs } from '@modern-js/utils';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';
import { expect } from '@modern-js/e2e/playwright';

const fixtures = resolve(__dirname, '../');

webpackOnlyTest('enableCssModuleTSDeclaration', async () => {
  fs.removeSync(join(fixtures, 'src/App.module.less.d.ts'));
  fs.removeSync(join(fixtures, 'src/App.module.scss.d.ts'));

  await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    builderConfig: {
      output: {
        enableCssModuleTSDeclaration: true,
      },
    },
  });

  expect(
    fs.existsSync(join(fixtures, 'src/App.module.less.d.ts')),
  ).toBeTruthy();

  expect(
    fs
      .readFileSync(join(fixtures, 'src/App.module.less.d.ts'), {
        encoding: 'utf-8',
      })
      .includes(`'title': string;`),
  ).toBeTruthy();

  expect(
    fs.existsSync(join(fixtures, 'src/App.module.scss.d.ts')),
  ).toBeTruthy();

  expect(
    fs
      .readFileSync(join(fixtures, 'src/App.module.scss.d.ts'), {
        encoding: 'utf-8',
      })
      .includes(`'header': string;`),
  ).toBeTruthy();
});

webpackOnlyTest('disableCssExtract', async ({ page }) => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      output: {
        disableCssExtract: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  // disableCssExtract worked
  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter(file => file.endsWith('.css'));

  expect(cssFiles.length).toBe(0);

  // scss worked
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('header')).fontSize`,
    ),
  ).resolves.toBe('20px');

  // less worked
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('20px');

  builder.close();
});
