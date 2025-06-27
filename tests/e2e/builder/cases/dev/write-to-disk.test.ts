import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { dev, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test('writeToDisk default', async ({ page }) => {
  const builder = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    builderConfig: {
      tools: {
        devServer: {
          client: {
            host: '',
            port: '',
          },
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Builder!');

  await builder.server.close();
});

test('writeToDisk false', async ({ page }) => {
  const builder = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    builderConfig: {
      tools: {
        devServer: {
          devMiddleware: {
            writeToDisk: false,
          },
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Builder!');

  await builder.server.close();
});

test('writeToDisk true', async ({ page }) => {
  const builder = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    builderConfig: {
      tools: {
        devServer: {
          devMiddleware: {
            writeToDisk: true,
          },
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Builder!');

  await builder.server.close();
});
