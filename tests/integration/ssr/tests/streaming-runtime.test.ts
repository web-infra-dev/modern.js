import type { ChildProcess } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import http from 'node:http';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

describe.each([
  ['development', true],
  ['production', true],
  ['development', false],
  ['production', false],
] as const)(
  'Streaming SSR runtime (%s, separate runtime: %s)',
  (mode, separateRuntime) => {
    let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
    let app: ChildProcess | undefined;
    let origin: string;
    let html: string;

    beforeAll(async () => {
      // Build/dev must not share generated files with the other streaming tests.
      fixture = await createIsolatedTestApp(fixtureDir);
      if (!separateRuntime) {
        await writeFile(
          path.join(fixture.appDir, 'modern.config.ts'),
          `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: true },
  performance: { prefetch: true },
  tools: {
    rspack(config, { isServer }) {
      if (!isServer) config.optimization.runtimeChunk = false;
    },
  },
});`,
        );
      }
      const port = await getPort();
      origin = `http://127.0.0.1:${port}`;
      if (mode === 'production') {
        const result = await modernBuild(fixture.appDir);
        expect(result.code, result.stderr || result.stdout).toBe(0);
        app = await modernServe(fixture.appDir, port);
      } else {
        app = await launchApp(fixture.appDir, port);
      }
      const response = await fetch(`${origin}/hydration`, {
        headers: { 'user-agent': 'Mozilla/5.0' },
      });
      expect(response.status).toBe(200);
      html = await response.text();
    });

    afterAll(async () => {
      try {
        if (app) await killApp(app);
      } finally {
        await fixture?.cleanup();
      }
    });

    test('places runtime after router data and keeps other initial scripts in head', () => {
      const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)];
      // This is also used by the builder inline-chunk e2e tests to identify runtime.
      const runtimeScripts = scripts.filter(script =>
        !separateRuntime
          ? /\ssrc="[^"]*\/index(?:\.[^"]+)?\.js"/.test(script[0])
          : mode === 'production'
            ? script[0].includes('Loading chunk')
            : /\ssrc="[^"]*\/builder-runtime\.js"/.test(script[0]),
      );
      expect(runtimeScripts).toHaveLength(1);
      const runtime = runtimeScripts[0];
      const initialData = scripts.find(script =>
        script[0].includes('data-script-src="modern-inline"'),
      );
      expect(initialData).toBeDefined();
      expect(runtime.index).toBeGreaterThan(html.indexOf('<body>'));
      expect(runtime.index).toBeGreaterThan(
        initialData!.index! + initialData![0].length,
      );
      const ssrData = scripts.find(script =>
        script[0].includes('window._SSR_DATA ='),
      );
      expect(ssrData).toBeDefined();
      expect(runtime.index).toBeGreaterThanOrEqual(
        ssrData!.index! + ssrData![0].length,
      );
      expect(runtime.index! + runtime[0].length).toBeLessThanOrEqual(
        html.indexOf('</body>'),
      );
      if (mode === 'production' && separateRuntime) {
        expect(runtime[0].slice(0, runtime[0].indexOf('>'))).not.toContain(
          'src=',
        );
      }
      if (!separateRuntime) {
        expect(html).not.toContain('/builder-runtime');
        expect(runtime[0]).toContain('async');
        const src = runtime[0].match(/\ssrc="([^"]+)"/)![1];
        const preloads = [...html.matchAll(/<link\b[^>]*>/g)].filter(
          link =>
            link[0].includes('rel="preload"') &&
            link[0].includes('as="script"') &&
            link[0].includes(`href="${src}"`),
        );
        expect(preloads).toHaveLength(1);
        expect(preloads[0].index).toBeLessThan(html.indexOf('</head>'));
      }
      const initialScripts = scripts.filter(
        script => /<script\b[^>]*\ssrc="/.test(script[0]) && script !== runtime,
      );
      expect(initialScripts.length).toBeGreaterThan(0);
      for (const script of initialScripts) {
        expect(script.index).toBeLessThan(html.indexOf('</head>'));
        expect(script[0]).toContain('async');
      }
    });

    if (mode === 'production') {
      test('waits for split router data before hydrating with cached entry scripts', async () => {
        const entrySrc = html.match(/\ssrc="([^"]*\/index\.[^"]+\.js)"/)?.[1];
        expect(entrySrc).toBeDefined();
        const initialScriptSrcs = [
          ...html
            .slice(0, html.indexOf('</head>'))
            .matchAll(/<script\b[^>]*\ssrc="([^"]+)"/g),
        ].map(script => script[1]);
        expect(initialScriptSrcs.length).toBeGreaterThan(0);
        if (separateRuntime) expect(initialScriptSrcs).toContain(entrySrc);
        const initialDataOffset = html.indexOf(
          'data-script-src="modern-inline"',
        );
        const loaderDataOffset = html.indexOf(
          '"loaderData":',
          initialDataOffset,
        );
        expect(initialDataOffset).toBeGreaterThan(-1);
        expect(loaderDataOffset).toBeGreaterThan(initialDataOffset);
        const splitOffset = loaderDataOffset + '"loaderData":'.length;
        let pendingResponse: ServerResponse | undefined;
        let notifySplit: () => void = () => {};
        const splitStarted = new Promise<void>(resolve => {
          notifySplit = resolve;
        });
        const proxy = http.createServer(async (request, response) => {
          try {
            if (request.url === '/hydration?split') {
              response.writeHead(200, {
                'content-type': 'text/html; charset=utf-8',
              });
              response.flushHeaders();
              response.write(html.slice(0, splitOffset));
              pendingResponse = response;
              notifySplit();
              return;
            }
            const upstream = await fetch(new URL(request.url!, origin));
            response.writeHead(upstream.status, {
              'content-type':
                upstream.headers.get('content-type') ||
                'application/octet-stream',
              // Warm and reuse the actual production assets in the browser cache.
              'cache-control': request.url!.startsWith('/static/')
                ? 'public, max-age=3600'
                : 'no-store',
            });
            response.end(Buffer.from(await upstream.arrayBuffer()));
          } catch (error) {
            response.destroy(
              error instanceof Error ? error : new Error(String(error)),
            );
          }
        });
        await new Promise<void>((resolve, reject) => {
          proxy.once('error', reject);
          proxy.listen(0, '127.0.0.1', () => {
            proxy.off('error', reject);
            resolve();
          });
        });
        const proxyAddress = proxy.address();
        if (!proxyAddress || typeof proxyAddress === 'string') {
          throw new Error('Expected the proxy to listen on a TCP port');
        }
        const proxyPort = proxyAddress.port;
        let navigation: Promise<unknown> | undefined;
        let browser: Browser | undefined;
        try {
          browser = await puppeteer.launch({
            ...launchOptions,
            headless: true,
          });
          const page = await browser.newPage();
          const proxyOrigin = `http://127.0.0.1:${proxyPort}`;
          await page.goto(`${proxyOrigin}/hydration`, {
            waitUntil: 'networkidle0',
          });
          const errors: string[] = [];
          const loaderRequests: string[] = [];
          let entryFromCache = false;
          page.on('pageerror', error => errors.push(error.message));
          page.on('request', request => {
            if (new URL(request.url()).searchParams.has('__loader')) {
              loaderRequests.push(request.url());
            }
          });
          page.on('response', response => {
            if (new URL(response.url()).pathname === entrySrc) {
              entryFromCache = response.fromCache();
            }
          });
          await page.evaluateOnNewDocument(
            sources => {
              const state = window as Window & {
                __loadedInitialScripts?: string[];
              };
              state.__loadedInitialScripts = [];
              document.addEventListener(
                'load',
                event => {
                  const script = event.target;
                  if (
                    script instanceof HTMLScriptElement &&
                    sources.includes(new URL(script.src).pathname)
                  ) {
                    state.__loadedInitialScripts!.push(
                      new URL(script.src).pathname,
                    );
                  }
                },
                true,
              );
            },
            [...new Set([...initialScriptSrcs, entrySrc!])],
          );
          navigation = page.goto(`${proxyOrigin}/hydration?split`, {
            waitUntil: 'networkidle0',
          });
          await Promise.race([splitStarted, navigation]);
          expect(pendingResponse).toBeDefined();
          await page.waitForFunction(
            sources =>
              sources.every(src =>
                (
                  window as Window & { __loadedInitialScripts?: string[] }
                ).__loadedInitialScripts?.includes(src),
              ),
            {},
            initialScriptSrcs,
          );
          expect(entryFromCache).toBe(true);
          // All initial JS files have executed. Leave the parser paused so
          // premature hydration can run if runtime was incorrectly emitted in head.
          await page.evaluate(
            () => new Promise(resolve => setTimeout(resolve, 250)),
          );
          if (!separateRuntime) {
            expect(
              await page.evaluate(
                src =>
                  (
                    window as Window & { __loadedInitialScripts?: string[] }
                  ).__loadedInitialScripts?.includes(src),
                entrySrc!,
              ),
            ).toBe(false);
          }
          pendingResponse!.end(html.slice(splitOffset));
          await navigation;
          const title = await page.evaluate(() => {
            const state = window as Window & {
              _ROUTER_DATA?: { loaderData: Record<string, { title: string }> };
            };
            return state._ROUTER_DATA?.loaderData['hydration/layout']?.title;
          });
          expect(title).toBe('Hydrated layout');
          expect(loaderRequests).toEqual([]);
          // SSR markup alone does not prove hydration. A same-document route
          // change confirms the entry actually started and attached handlers.
          await page.evaluate(() => {
            document.body.dataset.runtimeNavigation = 'same-document';
          });
          await page.click('#about-btn');
          await page.waitForFunction(
            () =>
              location.pathname === '/about' &&
              document.body.textContent?.includes('About content'),
          );
          expect(
            await page.evaluate(() => document.body.dataset.runtimeNavigation),
          ).toBe('same-document');
          expect(errors).toEqual([]);
        } finally {
          if (pendingResponse && !pendingResponse.writableEnded) {
            pendingResponse.end(html.slice(splitOffset));
          }
          try {
            await navigation?.catch(() => {});
          } finally {
            try {
              await browser?.close();
            } finally {
              await new Promise<void>((resolve, reject) => {
                proxy.close(error => (error ? reject(error) : resolve()));
                proxy.closeAllConnections();
              });
            }
          }
        }
      });
    }
  },
);
