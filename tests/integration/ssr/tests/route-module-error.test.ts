import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fs } from '@modern-js/utils';
import puppeteer, { type Browser } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');
const errorFixtureDir = path.join(fixtureDir, 'route-module-error');
const originalError = 'RouteModuleLoadError: SSR_ROUTE_MODULE_INIT_FAILED';

describe.each([
  ['string SSR', 'base'],
  ['streaming SSR', 'streaming'],
  ['CSR', 'base'],
] as const)('route module errors in %s', (mode, fixture) => {
  let app: ChildProcess | undefined;
  let browser: Browser | undefined;
  let cleanup: (() => Promise<void>) | undefined;
  let port: number;
  let serverOutput = '';
  const isCSR = mode === 'CSR';

  beforeAll(async () => {
    const isolated = await createIsolatedTestApp(
      path.join(fixtureDir, fixture),
    );
    cleanup = isolated.cleanup;
    const { appDir } = isolated;
    for (const route of ['module-error', 'chunk-error']) {
      await fs.copy(
        path.join(errorFixtureDir, route),
        path.join(appDir, 'src/routes', route),
      );
    }
    if (isCSR) {
      await fs.copyFile(
        path.join(errorFixtureDir, 'csr.config.ts'),
        path.join(appDir, 'modern.config.ts'),
      );
    }
    const build = await modernBuild(appDir);
    expect(build.code, `${build.stdout}\n${build.stderr}`).toBe(0);
    port = await getPort();
    app = await modernServe(appDir, port, {
      stdout: false,
      onStdout: (message: string) => {
        serverOutput += message;
      },
    });
    expect(app).toBeTruthy();
    // runContinuousTask forwards stdout, but module errors can use stderr.
    app!.stderr!.on('data', chunk => {
      serverOutput += chunk.toString();
    });
    browser = await puppeteer.launch(launchOptions as any);
  });

  afterAll(async () => {
    try {
      await browser?.close();
    } finally {
      try {
        if (app) {
          await killApp(app);
        }
      } finally {
        await cleanup?.();
      }
    }
  });

  test('renders a healthy route', async () => {
    if (isCSR) {
      const page = await browser!.newPage();
      try {
        await page.goto(`http://localhost:${port}/user/1`);
        await page.waitForFunction(() =>
          document.body.textContent?.includes('user1-18'),
        );
      } finally {
        await page.close();
      }
    } else {
      const response = await fetch(
        `http://localhost:${port}/user/1?no-cache=1`,
      );
      expect(response.status).toBe(200);
      const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
      expect(html).toContain('user1-18');
    }
  });

  if (!isCSR) {
    test('reports the original module initialization error on first and repeated SSR requests', async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const start = serverOutput.length;
        const response = await fetch(
          `http://localhost:${port}/module-error?no-cache=1`,
        );
        await response.text();
        // SSR handles the failure and returns its client-rendering fallback.
        expect(response.status).toBe(200);
        await expect
          .poll(() => serverOutput.slice(start), { timeout: 5000 })
          .toContain('SSR Error');
        const errorOutput = serverOutput.slice(start);
        expect(errorOutput).toContain(originalError);
        expect(errorOutput).not.toContain(
          'Cannot convert undefined or null to object',
        );
        expect(errorOutput).not.toContain('Element type is invalid');
      }

      const response = await fetch(
        `http://localhost:${port}/user/1?no-cache=1`,
      );
      expect(response.status).toBe(200);
      const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
      expect(html).toContain('user1-18');
    });
  }

  test('renders the route on the client even when its server module fails', async () => {
    const page = await browser!.newPage();
    try {
      await page.goto(`http://localhost:${port}/module-error?no-cache=1`);
      await page.waitForSelector('#module-error-client');
      expect(
        await page.$eval(
          '#module-error-client',
          element => element.textContent,
        ),
      ).toBe('Route module rendered on the client');
    } finally {
      await page.close();
    }
  });

  if (isCSR) {
    test.each(['initial request', 'client navigation'])(
      'passes ChunkLoadError to the route error boundary on %s and recovers after reload',
      async navigation => {
        const page = await browser!.newPage();
        let blockChunk = true;
        let blockedRequests = 0;
        try {
          await page.evaluateOnNewDocument(() => {
            const state = window as unknown as { unhandledErrors: string[] };
            state.unhandledErrors = [];
            window.addEventListener('unhandledrejection', event => {
              state.unhandledErrors.push(String(event.reason));
            });
          });
          await page.setRequestInterception(true);
          page.on('request', request => {
            if (
              blockChunk &&
              /\/chunk-error\/page(?:\.[^/]+)?\.js(?:\?|$)/.test(request.url())
            ) {
              blockedRequests++;
              void request.abort();
            } else {
              void request.continue();
            }
          });
          if (navigation === 'client navigation') {
            await page.goto(`http://localhost:${port}/module-error`);
            await page.waitForSelector('#chunk-error-link');
            await page.click('#chunk-error-link');
          } else {
            await page.goto(`http://localhost:${port}/chunk-error`);
          }
          await page.waitForSelector('#route-error');
          const error = await page.$eval(
            '#route-error',
            element => element.textContent,
          );
          expect(blockedRequests).toBeGreaterThan(0);
          expect(error).toContain('ChunkLoadError');
          expect(error).toContain('Loading chunk');
          expect(error).not.toContain('TypeError');
          expect(
            await page.evaluate(
              () =>
                (window as unknown as { unhandledErrors: string[] })
                  .unhandledErrors,
            ),
          ).toEqual([]);

          blockChunk = false;
          await page.reload();
          await page.waitForSelector('#chunk-error-page');
          expect(
            await page.$eval(
              '#chunk-error-page',
              element => element.textContent,
            ),
          ).toBe('Route chunk loaded');
        } finally {
          await page.close();
        }
      },
    );
  }
});
