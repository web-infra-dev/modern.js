import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
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

// todo: moduleScopes not work when buildCache is false ???
test.skip('module-scopes', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'module-scopes'),
    entry: {
      main: join(fixtures, 'module-scopes/src/index.js'),
    },
  };

  await expect(
    build({
      ...buildOpts,
      builderConfig: {
        source: {
          moduleScopes: ['./src'],
        },
      },
    }),
  ).rejects.toThrowError('webpack build failed!');

  let builder = await build({
    ...buildOpts,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder! 1');

  builder.close();

  // should not throw
  builder = await build({
    ...buildOpts,
    builderConfig: {
      source: {
        moduleScopes: ['./src', './common'],
      },
    },
  });

  builder.close();
});

test('global-vars & tsConfigPath', async ({ page }) => {
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
  await expect(
    page.evaluate(`document.getElementById('test-el').innerHTML`),
  ).resolves.toBe('aaaaa');

  await expect(
    page.evaluate(`document.getElementById('test-alias-el').innerHTML`),
  ).resolves.toBe('alias work correctly');

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
  await expect(
    page.evaluate(`document.getElementById('test-el').innerHTML`),
  ).resolves.toBe('aaaaa');

  builder.close();
});
