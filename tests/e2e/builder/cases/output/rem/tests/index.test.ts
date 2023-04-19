import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = resolve(__dirname, '../');

allProviderTest('rem default (disable)', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    output: {},
  });
  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('20px');

  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('description')).fontSize`,
    ),
  ).resolves.toBe('16px');

  builder.close();
});

allProviderTest('rem enable', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
  };

  // convert to rem
  const builder = await build(buildOpts, {
    output: {
      convertToRem: true,
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate('document.documentElement.style.fontSize'),
  ).resolves.toBe('64px');

  // less convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('25.6px');

  // scss convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('header')).fontSize`,
    ),
  ).resolves.toBe('25.6px');

  // css convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('description')).fontSize`,
    ),
  ).resolves.toBe('20.48px');

  builder.close();
});

allProviderTest('should inline runtime code to html by default', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: { index: join(fixtures, 'src/index.ts') },
    builderConfig: {
      output: {
        convertToRem: {},
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!].includes('function setRootPixel')).toBeTruthy();
});

allProviderTest(
  'should extract runtime code when inlineRuntime is false',
  async () => {
    const builder = await build({
      cwd: fixtures,
      entry: { index: join(fixtures, 'src/index.ts') },
      builderConfig: {
        output: {
          convertToRem: {
            inlineRuntime: false,
          },
        },
      },
    });
    const files = await builder.unwrapOutputJSON();

    const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));
    const retryFile = Object.keys(files).find(
      file => file.includes('/convert-rem') && file.endsWith('.js'),
    );

    expect(htmlFile).toBeTruthy();
    expect(retryFile).toBeTruthy();
    expect(files[htmlFile!].includes('function setRootPixel')).toBeFalsy();
  },
);
