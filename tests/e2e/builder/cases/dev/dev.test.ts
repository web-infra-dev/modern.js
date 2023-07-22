import { join } from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { dev, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

// hmr test will timeout in CI
test.skip('default & hmr (default true)', async ({ page }) => {
  await fs.copy(join(fixtures, 'hmr/src'), join(fixtures, 'hmr/test-src'));
  const builder = await dev({
    cwd: join(fixtures, 'hmr'),
    entry: {
      main: join(fixtures, 'hmr', 'test-src/index.ts'),
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
  await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const appPath = join(fixtures, 'hmr', 'test-src/App.tsx');

  await fs.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('Hello Builder', 'Hello Test'),
  );

  // wait for hmr take effect
  await new Promise(resolve => setTimeout(resolve, 2000));

  await expect(locator).toHaveText('Hello Test!');

  const cssPath = join(fixtures, 'hmr', 'test-src/App.css');

  await fs.writeFile(
    cssPath,
    `#test {
  color: rgb(0, 0, 255);
}`,
  );

  // wait for hmr take effect
  await new Promise(resolve => setTimeout(resolve, 2000));

  await expect(locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  // restore
  await fs.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('Hello Test', 'Hello Builder'),
  );

  await fs.writeFile(
    cssPath,
    `#test {
  color: rgb(255, 0, 0);
}`,
  );

  await builder.server.close();
});

test.skip('dev.port & output.distPath', async ({ page }) => {
  const builder = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    builderConfig: {
      dev: {
        port: 3000,
      },
      output: {
        distPath: {
          root: 'dist-1',
          js: 'aa/js',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  expect(builder.port).toBe(3000);

  expect(
    fs.existsSync(join(fixtures, 'basic/dist-1/html/main/index.html')),
  ).toBeTruthy();

  expect(fs.existsSync(join(fixtures, 'basic/dist-1/aa/js'))).toBeTruthy();

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Builder!');

  await builder.server.close();

  await fs.remove(join(fixtures, 'basic/dist-1'));
});

test.skip('hmr should work when setting dev.port & serverOptions.dev.client', async ({
  page,
}) => {
  await fs.copy(join(fixtures, 'hmr/src'), join(fixtures, 'hmr/test-src-1'));
  const cwd = join(fixtures, 'hmr');
  const builder = await dev({
    cwd,
    entry: {
      main: join(cwd, 'test-src-1/index.ts'),
    },
    builderConfig: {
      dev: {
        port: 3001,
      },
    },
    serverOptions: {
      dev: {
        client: {
          host: '',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  expect(builder.port).toBe(3001);

  const appPath = join(fixtures, 'hmr', 'test-src-1/App.tsx');

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Builder!');

  await fs.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('Hello Builder', 'Hello Test'),
  );

  // wait for hmr take effect
  await new Promise(resolve => setTimeout(resolve, 2000));
  await expect(locator).toHaveText('Hello Test!');

  // restore
  await fs.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('Hello Test', 'Hello Builder'),
  );

  await builder.server.close();
});

// need devcert
test.skip('dev.https', async () => {
  const builder = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(join(fixtures, 'basic'), 'src/index.ts'),
    },
    builderConfig: {
      dev: {
        https: true,
      },
    },
  });

  expect(builder.urls[0].startsWith('https')).toBeTruthy();

  await builder.server.close();
});

// hmr will timeout in CI
test.skip('tools.devServer', async ({ page }) => {
  let i = 0;
  let reloadFn: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  const builder = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(join(fixtures, 'basic'), 'src/index.ts'),
    },
    builderConfig: {
      tools: {
        devServer: {
          setupMiddlewares: [
            (_middlewares, server) => {
              reloadFn = () => server.sockWrite('content-changed');
            },
          ],
          before: [
            (req, res, next) => {
              i++;
              next();
            },
          ],
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Builder!');

  expect(i).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  i = 0;
  reloadFn!();

  // wait for page reload take effect
  await new Promise(resolve => setTimeout(resolve, 2000));

  expect(i).toBeGreaterThanOrEqual(1);

  await builder.server.close();
});
