import path, { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test.describe('source configure multi', () => {
  let builder: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    builder = await build({
      cwd: join(fixtures, 'basic'),
      entry: {
        main: join(fixtures, 'basic/src/index.js'),
      },
      runServer: true,
      builderConfig: {
        source: {
          alias: {
            '@common': './src/common',
          },
          preEntry: ['./src/pre.js'],
        },
      },
    });
  });

  test.afterAll(() => {
    builder.close();
  });

  test('alias', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));
    await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder! 1');
  });

  test('pre-entry', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));
    await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

    // test order
    await expect(page.evaluate(`window.aa`)).resolves.toBe(2);
  });
});

test('global-vars', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'global-vars'),
    entry: {
      main: join(fixtures, 'global-vars/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      source: {
        globalVars: {
          ENABLE_TEST: true,
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  builder.close();
});

test('define', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'global-vars'),
    entry: {
      main: join(fixtures, 'global-vars/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      source: {
        define: {
          ENABLE_TEST: JSON.stringify(true),
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  builder.close();
});

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const cwd = join(fixtures, 'tsconfig-paths');
  const builder = await build({
    cwd,
    entry: {
      main: join(cwd, 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      source: {
        alias: {
          '@common': './src/common2',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  builder.close();
});

test('tsconfig paths should not work when aliasStrategy is "prefer-alias"', async ({
  page,
}) => {
  const cwd = join(fixtures, 'tsconfig-paths');
  const builder = await build({
    cwd,
    entry: {
      main: join(cwd, 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      source: {
        alias: {
          '@/common': './src/common2',
        },
      },
      resolve: {
        aliasStrategy: 'prefer-alias',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('source.alias worked');

  builder.close();
});
