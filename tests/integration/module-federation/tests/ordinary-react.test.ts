import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import getPort from 'get-port';
import puppeteer, { type Browser } from 'puppeteer';
import treeKill from 'tree-kill';

const exec = promisify(execFile);
const source = path.resolve(__dirname, '../../basic-app');
const require = createRequire(path.join(source, 'package.json'));
const modern = path.resolve(
  path.dirname(require.resolve('@modern-js/app-tools')),
  '../../bin/modern.js',
);
const forbiddenRuntime =
  /__MF_BRIDGE_SSR__|BridgeSSRContext|mf-bridge-producer\/1/;

async function createApp(mode: 'csr' | 'string' | 'stream', port: number) {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'modern-ordinary-react-'),
  );
  try {
    const manifest = JSON.parse(
      await readFile(path.join(source, 'package.json'), 'utf8'),
    );
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify(manifest),
    );
    await mkdir(path.join(directory, 'node_modules'));
    // Keep real React, runtime and TypeScript dependencies, while each fixture
    // owns its generated entry directory and cache.
    for (const entry of await readdir(path.join(source, 'node_modules'))) {
      if (entry.startsWith('.')) continue;
      await symlink(
        path.join(source, 'node_modules', entry),
        path.join(directory, 'node_modules', entry),
        'dir',
      );
    }
    await mkdir(path.join(directory, 'src/routes'), { recursive: true });
    await writeFile(
      path.join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2021',
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          esModuleInterop: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['src', 'modern.config.ts'],
      }),
    );
    await writeFile(
      path.join(directory, 'modern.config.ts'),
      `
import { appTools, defineConfig } from '@modern-js/app-tools';
export default defineConfig({
  plugins: [appTools()],
  server: { port: ${port}, ssr: ${mode === 'csr' ? 'false' : `{ mode: '${mode}' }`} },
  performance: { buildCache: false },
});
`,
    );
    await writeFile(
      path.join(directory, 'src/routes/layout.tsx'),
      `import { Outlet } from '@modern-js/runtime/router';
export default function Layout() { return <Outlet />; }
`,
    );
    await writeFile(
      path.join(directory, 'src/routes/page.tsx'),
      `
import { useState } from 'react';
export default function App() {
  const [count, setCount] = useState(0);
  return <main data-testid="ordinary-app"><h1>Ordinary React application</h1>
    <button data-testid="ordinary-count" onClick={() => setCount(count + 1)}>Count: {count}</button>
  </main>;
}
`,
    );
    await writeFile(
      path.join(directory, 'src/modern.runtime.tsx'),
      `
import { useEffect } from 'react';
import { defineRuntimeConfig, type RuntimePlugin } from '@modern-js/runtime';
const observer = (): RuntimePlugin => ({
  name: 'ordinary-runtime-observer',
  setup(api) {
    api.wrapRoot(App => function OrdinaryRoot(props) {
      useEffect(() => { document.documentElement.dataset.ordinaryReady = 'true'; }, []);
      return <><App {...props} /></>;
    });
  },
});
export default defineRuntimeConfig({ plugins: [observer()] });
`,
    );
    return directory;
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

async function stop(child: ChildProcess | undefined) {
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    await new Promise<void>(resolve =>
      treeKill(child.pid!, 'SIGTERM', () => resolve()),
    );
  }
}

describe('Ordinary React production builds without module federation', () => {
  let browser: Browser;
  let browserProfile: string;
  beforeAll(async () => {
    browserProfile = await mkdtemp(
      path.join(tmpdir(), 'modern-ordinary-browser-'),
    );
    browser = await puppeteer.launch({
      headless: true,
      userDataDir: browserProfile,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  });
  afterAll(async () => {
    try {
      await browser?.close();
    } finally {
      if (browserProfile)
        await rm(browserProfile, { recursive: true, force: true });
    }
  });

  it.each(['csr', 'string', 'stream'] as const)(
    '%s preserves normal rendering and excludes the Bridge engine',
    async mode => {
      const port = await getPort({ port: getPort.makeRange(27000, 32000) });
      const directory = await createApp(mode, port);
      const page = await browser.newPage();
      let server: ChildProcess | undefined;
      let serverLog = '';
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => {
        if (
          message.type() === 'error' &&
          /hydration|Minified React error|server rendered|matching/i.test(
            message.text(),
          )
        ) {
          errors.push(message.text());
        }
      });
      try {
        await exec(process.execPath, [modern, 'build'], {
          cwd: directory,
          env: { ...process.env, NODE_ENV: 'production', NODE_PATH: '' },
          timeout: 90000,
          maxBuffer: 4 * 1024 * 1024,
        });
        const output = path.join(directory, 'dist');
        const files = await readdir(output, { recursive: true });
        const artifacts = await Promise.all(
          files
            .filter(file => /\.(?:m?js|html)$/.test(file))
            .map(file => readFile(path.join(output, file), 'utf8')),
        );
        expect(artifacts.length).toBeGreaterThan(0);
        expect(artifacts.join('\n')).not.toMatch(forbiddenRuntime);
        server = spawn(process.execPath, [modern, 'serve'], {
          cwd: directory,
          env: { ...process.env, NODE_ENV: 'production' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        server.on('error', error => {
          serverLog += String(error);
        });
        for (const stream of [server.stdout, server.stderr]) {
          stream?.on('data', chunk => {
            serverLog += chunk;
          });
        }
        const url = `http://localhost:${port}/`;
        await expect
          .poll(
            async () => {
              try {
                return (await fetch(url, { signal: AbortSignal.timeout(1000) }))
                  .status;
              } catch {
                return 0;
              }
            },
            { timeout: 20000 },
          )
          .toBe(200);
        const response = await fetch(url);
        const html = await response.text();
        expect(response.status).toBe(200);
        expect(html).not.toMatch(forbiddenRuntime);
        if (mode === 'csr') {
          expect(html).not.toContain('data-testid="ordinary-app"');
        } else {
          expect(html).toContain('data-testid="ordinary-app"');
          expect(html).toContain('Ordinary React application');
        }
        await page.setRequestInterception(true);
        page.on('request', async request => {
          if (request.resourceType() === 'script') await gate;
          if (!request.isInterceptResolutionHandled()) await request.continue();
        });
        const navigation = page.goto(url, { waitUntil: 'domcontentloaded' });
        try {
          if (mode !== 'csr') {
            await page.waitForSelector('[data-testid="ordinary-count"]');
            expect(
              await page.evaluate(
                () => document.documentElement.dataset.ordinaryReady,
              ),
            ).toBeUndefined();
            await page.evaluate(() => {
              (window as any).__ordinaryServerNode = document.querySelector(
                '[data-testid="ordinary-count"]',
              );
            });
          }
          release();
          await navigation;
          await page.waitForSelector('html[data-ordinary-ready="true"]');
          await page.waitForSelector('[data-testid="ordinary-count"]');
          if (mode !== 'csr') {
            expect(
              await page.evaluate(
                () =>
                  (window as any).__ordinaryServerNode ===
                  document.querySelector('[data-testid="ordinary-count"]'),
              ),
            ).toBe(true);
          }
          await page.click('[data-testid="ordinary-count"]');
          await page.waitForFunction(
            () =>
              document.querySelector('[data-testid="ordinary-count"]')
                ?.textContent === 'Count: 1',
          );
          expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
          expect(errors).toEqual([]);
        } finally {
          release();
          await navigation;
        }
      } catch (error) {
        throw new Error(
          `${mode} ordinary React regression failed\n${String(error)}\n${JSON.stringify({ url: page.url(), errors })}\n${serverLog}`,
          { cause: error },
        );
      } finally {
        release();
        await page.close();
        await stop(server);
        await rm(directory, { recursive: true, force: true });
      }
    },
    120000,
  );
});
