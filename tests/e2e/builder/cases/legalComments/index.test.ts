import { join } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest, webpackOnlyTest } from '@scripts/helper';

const fixtures = __dirname;

allProviderTest('legalComments linked (default)', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
  };

  const builder = await build(buildOpts, {
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder!');

  const files = await builder.unwrapOutputJSON();

  const LicenseContent =
    files[
      Object.keys(files).find(
        file => file.includes('js/main') && file.endsWith('.LICENSE.txt'),
      )!
    ];

  expect(LicenseContent.includes('@preserve AAAA')).toBeTruthy();
  expect(LicenseContent.includes('@license BBB')).toBeTruthy();
  expect(LicenseContent.includes('Legal Comment CCC')).toBeTruthy();
  expect(LicenseContent.includes('Foo Bar')).toBeFalsy();

  const JsContent =
    files[
      Object.keys(files).find(
        file => file.includes('js/main') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('Foo Bar')).toBeFalsy();

  builder.close();
});

allProviderTest('legalComments none', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
  };

  const builder = await build(buildOpts, {
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
    output: {
      legalComments: 'none',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder!');

  const files = await builder.unwrapOutputJSON();

  const LicenseFile = Object.keys(files).find(
    file => file.includes('js/main') && file.endsWith('.LICENSE.txt'),
  )!;

  expect(LicenseFile).toBeUndefined();

  const JsContent =
    files[
      Object.keys(files).find(
        file => file.includes('js/main') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('@license BBB')).toBeFalsy();

  builder.close();
});

webpackOnlyTest('legalComments inline', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
  };

  const builder = await build(buildOpts, {
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
    output: {
      legalComments: 'inline',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder!');

  const files = await builder.unwrapOutputJSON();

  const LicenseFile = Object.keys(files).find(
    file => file.includes('js/main') && file.endsWith('.LICENSE.txt'),
  )!;

  expect(LicenseFile).toBeUndefined();

  const JsContent =
    files[
      Object.keys(files).find(
        file => file.includes('js/main') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('@license BBB')).toBeTruthy();
  expect(JsContent.includes('Foo Bar')).toBeFalsy();

  builder.close();
});
