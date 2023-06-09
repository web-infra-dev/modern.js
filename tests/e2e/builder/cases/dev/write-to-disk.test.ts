import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { dev, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test('writeToDisk default', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
  };

  const builder = await dev(buildOpts, {
    tools: {
      devServer: {
        client: {
          host: '',
          port: '',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await builder.server.close();
});

test('writeToDisk false', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
  };

  const builder = await dev(buildOpts, {
    tools: {
      devServer: {
        devMiddleware: {
          writeToDisk: false,
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await builder.server.close();
});

test('writeToDisk true', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
  };

  const builder = await dev(buildOpts, {
    tools: {
      devServer: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await builder.server.close();
});
