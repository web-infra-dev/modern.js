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
} from '../../../utils/modernTestUtils';

const fixture = path.resolve(__dirname, '..');
const storybook = createRequire(path.join(fixture, 'package.json')).resolve(
  'storybook/internal/bin/dispatcher',
);
const env = { ...process.env, CI: 'true', STORYBOOK_DISABLE_TELEMETRY: '1' };
let app: Awaited<ReturnType<typeof createIsolatedTestApp>>;

beforeEach(async () => {
  app = await createIsolatedTestApp(fixture, {
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
    path.join(app.appDir, 'src/Design.stories.js'),
    `import { Button } from '${componentImport}';
     export default { title: 'Design', component: Button };
     export const Preview = { args: { buttonLabel: 'New preview' } };`,
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
      await page.goto(`${url}/?path=/docs/components-button--docs`);
      const frame = await page.waitForFrame(frame =>
        frame.url().includes('/iframe.html'),
      );
      await frame.waitForFunction(
        () =>
          document.body.innerText.includes('Button') &&
          document.body.innerText.includes('buttonLabel'),
      );

      await addButtonStory('@components/Button');
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
      const componentPath = path.join(app.appDir, 'src/Button.tsx');
      const component = await readFile(componentPath, 'utf8');
      await writeFile(
        componentPath,
        component.replace('{buttonLabel}', '{buttonLabel.toUpperCase()}'),
      );
      await expect
        .poll(() => page.$eval('#storybook-root', root => root.textContent), {
          timeout: 30_000,
        })
        .toContain('NEW PREVIEW');
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
          resolve: { alias: { '@preview-button': path.resolve('src/Button') } },
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
