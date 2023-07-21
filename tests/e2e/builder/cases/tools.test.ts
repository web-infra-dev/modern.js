import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = __dirname;

test('postcss plugins overwrite', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'output/rem'),
    entry: {
      main: join(fixtures, 'output/rem/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        postcss: {
          postcssOptions: {
            plugins: [],
          },
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const title = page.locator('#title');
  await expect(title).toHaveText('title');

  builder.close();
});

test('bundlerChain - set alias config', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'source/basic'),
    entry: {
      main: join(fixtures, 'source/basic/src/index.js'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        bundlerChain: chain => {
          chain.resolve.alias.merge({
            '@common': join(fixtures, 'source/basic/src/common'),
          });
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder! 1');

  builder.close();
});

// Rspack do not support publicPath function yet
webpackOnlyTest('bundlerChain - custom publicPath function', async () => {
  const builder = await build({
    cwd: join(fixtures, 'output/rem'),
    entry: {
      main: join(fixtures, 'output/rem/src/index.ts'),
    },
    builderConfig: {
      output: {
        disableFilenameHash: true,
      },
      tools: {
        bundlerChain: chain => {
          chain.output.publicPath(() => 'https://www.foo.com/');
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));
  expect(htmlFile).toBeTruthy();

  const htmlContent = files[htmlFile!];
  expect(htmlContent).toContain(
    `script defer="defer" src="https://www.foo.com/static/js/main.js"></script>`,
  );
  expect(htmlContent).toContain(
    `<link href="https://www.foo.com/static/css/main.css" rel="stylesheet">`,
  );
});
