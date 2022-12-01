import { join, resolve, dirname } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { fs } from '@modern-js/utils';
import { build, getHrefByEntryName } from '../scripts/shared';
import { webpackOnlyTest, allProviderTest } from './helper';

const fixtures = resolve(__dirname, '../fixtures/output');

webpackOnlyTest.describe('output configure multi', () => {
  const distFilePath = join(fixtures, 'rem/dist-1/test.json');

  let builder: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    const buildOpts = {
      cwd: join(fixtures, 'rem'),
      entry: {
        main: join(fixtures, 'rem/src/index.ts'),
      },
    };

    await fs.mkdir(dirname(distFilePath), { recursive: true });
    await fs.writeFile(
      distFilePath,
      `{
      "test": 1
    }`,
    );

    builder = await build(buildOpts, {
      output: {
        distPath: {
          root: 'dist-1',
          js: 'aa/js',
        },
        copy: [{ from: './src/assets', to: '' }],
      },
    });
  });

  test.afterAll(async () => {
    await builder.clean();
  });

  test('rem default (disable)', async ({ page }) => {
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
  });

  test('cleanDistPath default (enable)', async () => {
    expect(fs.existsSync(distFilePath)).toBeFalsy();
  });

  test('copy', async () => {
    expect(fs.existsSync(join(fixtures, 'rem/dist-1/icon.png'))).toBeTruthy();
  });

  test('distPath', async () => {
    expect(
      fs.existsSync(join(fixtures, 'rem/dist-1/html/main/index.html')),
    ).toBeTruthy();

    expect(fs.existsSync(join(fixtures, 'rem/dist-1/aa/js'))).toBeTruthy();
  });
});

webpackOnlyTest('rem enable', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'rem'),
    entry: {
      main: join(fixtures, 'rem/src/index.ts'),
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
});

webpackOnlyTest('cleanDistPath disable', async () => {
  const buildOpts = {
    cwd: join(fixtures, 'rem'),
    entry: {
      main: join(fixtures, 'rem/src/index.ts'),
    },
  };

  const distFilePath = join(fixtures, 'rem/dist/test.json');

  await fs.mkdir(dirname(distFilePath), { recursive: true });
  await fs.writeFile(
    distFilePath,
    `{
    "test": 1
  }`,
  );

  await build(buildOpts, {
    output: {
      cleanDistPath: false,
    },
  });

  expect(fs.existsSync(distFilePath)).toBeTruthy();
});

allProviderTest('externals', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'externals'),
    entry: {
      main: join(fixtures, 'externals/src/index.js'),
    },
  };

  const builder = await build(buildOpts, {
    output: {
      externals: {
        aaa: 'aa',
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
});
