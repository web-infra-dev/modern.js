// Adapted from rstackjs/storybook-rsbuild's Modern.js e2e suite (v3.6.3, MIT).
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, expect, test } from '@rstest/core';
import puppeteer from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
} from '../../utils/modernTestUtils';

const example = path.resolve(__dirname, '../../../examples/storybook');
const storybook = createRequire(path.join(example, 'package.json')).resolve(
  'storybook/internal/bin/dispatcher',
);
const env = { ...process.env, CI: 'true', STORYBOOK_DISABLE_TELEMETRY: '1' };
let app: Awaited<ReturnType<typeof createIsolatedTestApp>>;

beforeEach(async () => {
  app = await createIsolatedTestApp(example, {
    parentDir: tmpdir(),
    prefix: 'modern-storybook-',
    exclude: ['storybook-static'],
  });
});

afterEach(async () => {
  await app?.cleanup();
});

function addButtonStory(componentImport: string) {
  return writeFile(
    path.join(app.appDir, 'src/stories/Design.stories.js'),
    `import { AntdButton } from '${componentImport}';
     export default { title: 'Design', component: AntdButton };
     export const Preview = { args: { children: 'New preview', myButtonExtra: '' } };`,
  );
}

test('renders component docs and hot-updates a newly added story', async () => {
  const port = await getPort();
  const url = `http://127.0.0.1:${port}`;
  const server = spawn(
    process.execPath,
    [
      storybook,
      'dev',
      '--ci',
      '--exact-port',
      '--no-open',
      '--host',
      '127.0.0.1',
      '-p',
      String(port),
    ],
    {
      cwd: app.appDir,
      env: { ...env, NODE_ENV: 'development' },
      stdio: 'inherit',
    },
  );
  const closed = once(server, 'exit');
  try {
    await Promise.race([
      closed.then(([code]) => {
        throw new Error(`Storybook exited with code ${code}`);
      }),
      expect
        .poll(async () => (await fetch(`${url}/index.json`)).ok, {
          timeout: 90_000,
          interval: 500,
        })
        .toBe(true),
    ]);
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.goto(`${url}/?path=/docs/example-antdbutton--docs`);
      const frame = await page.waitForFrame(frame =>
        frame.url().includes('/iframe.html'),
      );
      await frame.waitForFunction(
        () =>
          document.body.innerText.includes('AntdButton') &&
          document.body.innerText.includes('myButtonExtra'),
      );

      const stories = path.join(app.appDir, 'src/stories');
      await addButtonStory('@my-src/stories/AntdButton');
      await expect
        .poll(
          async () =>
            (await (await fetch(`${url}/index.json`)).json()).entries[
              'design--preview'
            ],
          { timeout: 30_000 },
        )
        .toBeDefined();
      await page.goto(`${url}/iframe.html?id=design--preview&viewMode=story`);
      await expect
        .poll(() => page.$eval('#storybook-root', root => root.textContent), {
          timeout: 30_000,
        })
        .toContain('New preview');
      await page.evaluate(() => {
        document.documentElement.dataset.hmr = 'mounted';
      });
      const componentPath = path.join(stories, 'AntdButton.tsx');
      const component = await readFile(componentPath, 'utf8');
      await writeFile(
        componentPath,
        component.replace('res:', 'Updated result:'),
      );
      await expect
        .poll(() => page.$eval('#storybook-root', root => root.textContent), {
          timeout: 30_000,
        })
        .toContain('Updated result:');
      expect(
        await page.evaluate(() => document.documentElement.dataset.hmr),
      ).toBe('mounted');
    } finally {
      await browser.close();
    }
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      await killApp(server);
    }
    await closed;
  }
}, 180_000);

test('builds the client preview and preserves the application output', async () => {
  const file = (name: string) => path.join(app.appDir, name);
  await rename(file('modern.config.ts'), file('base.config.ts'));
  await writeFile(
    file('modern.config.mjs'),
    `
    import path from 'node:path';
    import base from './base.config.ts';
    export default {
      ...base,
      output: {
        ...base.output,
        distPath: { root: 'dist' },
        cleanDistPath: true,
        filename: { js: 'host-only-[name].js' },
        assetPrefix: '/host-only-base/',
      },
      environments: {
        client: {
          output: { assetPrefix: '/host-only-client/' },
          resolve: { alias: { '@preview-button': path.resolve('src/stories/AntdButton') } },
        },
        server: {
          output: { assetPrefix: '/host-only-server/' },
          resolve: { alias: { '@preview-button': './missing-server-button' } },
        },
      },
    };
  `,
  );
  await addButtonStory('@preview-button');
  await mkdir(file('dist'));
  await writeFile(file('dist/sentinel.txt'), 'existing application build');
  await promisify(execFile)(process.execPath, [storybook, 'build'], {
    cwd: app.appDir,
    env: { ...env, NODE_ENV: 'production' },
    timeout: 240_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  expect(await readdir(file('dist'))).toEqual(['sentinel.txt']);
  expect(await readFile(file('dist/sentinel.txt'), 'utf8')).toBe(
    'existing application build',
  );
  const html = await readFile(file('storybook-static/iframe.html'), 'utf8');
  expect(html).not.toContain('host-only-');
  expect(html).toContain('iframe.bundle.js');
}, 300_000);
