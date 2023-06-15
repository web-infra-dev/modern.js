import { join } from 'path';
import { build, getHrefByEntryName } from '@scripts/shared';
import { expect, test } from '@modern-js/e2e/playwright';

const fixtures = __dirname;

test('should inline style when disableCssExtract is false', async ({
  page,
}) => {
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

  // should inline minified css
  const mainJsFile = Object.keys(files).find(file => file.includes('main.'))!;
  expect(
    files[mainJsFile].includes(
      'body,html{margin:0;padding:0}*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-moz-box-sizing:border-box;box-sizing:border-box}',
    ),
  ).toBeTruthy();

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
