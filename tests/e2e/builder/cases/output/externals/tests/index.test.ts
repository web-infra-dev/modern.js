import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = resolve(__dirname, '../');

allProviderTest('externals', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {
    output: {
      externals: {
        './aaa': 'aa',
      },
    },
    source: {
      preEntry: './src/ex.js',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await expect(
    page.evaluate(`document.getElementById('test-external').innerHTML`),
  ).resolves.toBe('1');

  const externalVar = await page.evaluate(`window.aa`);

  expect(externalVar).toBeDefined();

  builder.clean();
  builder.close();
});

allProviderTest(
  'should not external dependencies when target is web worker',
  async () => {
    const builder = await build(
      {
        cwd: fixtures,
        target: 'web-worker',
        entry: { index: resolve(fixtures, './src/index.js') },
      },
      {
        output: {
          externals: {
            react: 'MyReact',
          },
        },
      },
      false,
    );
    const files = await builder.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find(file => file.endsWith('.js'))!];
    expect(content.includes('MyReact')).toBeFalsy();

    builder.clean();
  },
);
