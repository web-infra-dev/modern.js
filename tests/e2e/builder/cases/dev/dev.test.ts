import { join } from 'path';
import { fs } from '@modern-js/utils';
import { expect } from '@modern-js/e2e/playwright';
import { dev, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = __dirname;

allProviderTest('default & hmr (default true)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'hmr'),
    entry: {
      main: join(fixtures, 'hmr', 'src/index.ts'),
    },
  };

  const builder = await dev(buildOpts);

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await expect(
    page.evaluate(`getComputedStyle(document.getElementById('test')).color`),
  ).resolves.toBe('rgb(255, 0, 0)');

  const appPath = join(fixtures, 'hmr', 'src/App.tsx');

  await fs.writeFile(
    appPath,
    `import React from 'react';
import './App.css';

const App = () => <div id="test">Hello Test!</div>;
export default App;
`,
  );

  // wait for hmr take effect
  await new Promise(resolve => setTimeout(resolve, 2000));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Test!');

  const cssPath = join(fixtures, 'hmr', 'src/App.css');

  await fs.writeFile(
    cssPath,
    `#test {
  color: rgb(0, 0, 255);
}`,
  );

  // wait for hmr take effect
  await new Promise(resolve => setTimeout(resolve, 2000));

  await expect(
    page.evaluate(`getComputedStyle(document.getElementById('test')).color`),
  ).resolves.toBe('rgb(0, 0, 255)');

  // restore
  await fs.writeFile(
    appPath,
    `import React from 'react';
import './App.css';

const App = () => <div id="test">Hello Builder!</div>;
export default App;
`,
  );

  await fs.writeFile(
    cssPath,
    `#test {
  color: rgb(255, 0, 0);
}`,
  );

  await builder.server.close();
});

allProviderTest('dev.port & output.distPath', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
  };

  const builder = await dev(buildOpts, {
    dev: {
      port: 3000,
    },
    output: {
      distPath: {
        root: 'dist-1',
        js: 'aa/js',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  expect(builder.port).toBe(3000);

  expect(
    fs.existsSync(join(fixtures, 'basic/dist-1/html/main/index.html')),
  ).toBeTruthy();

  expect(fs.existsSync(join(fixtures, 'basic/dist-1/aa/js'))).toBeTruthy();

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await builder.server.close();

  await fs.remove(join(fixtures, 'basic/dist-1'));
});

allProviderTest('dev.https', async () => {
  const buildOpts = {
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(join(fixtures, 'basic'), 'src/index.ts'),
    },
  };

  const builder = await dev(buildOpts, {
    dev: {
      https: true,
    },
  });

  expect(builder.urls[0].startsWith('https')).toBeTruthy();

  await builder.server.close();
});

allProviderTest('tools.devServer', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(join(fixtures, 'basic'), 'src/index.ts'),
    },
  };

  let i = 0;
  let reloadFn: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  const builder = await dev(buildOpts, {
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
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  expect(i).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  i = 0;
  reloadFn!();

  // wait for page reload take effect
  await new Promise(resolve => setTimeout(resolve, 2000));

  expect(i).toBeGreaterThanOrEqual(1);

  await builder.server.close();
});
