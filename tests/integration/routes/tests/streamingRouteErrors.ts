import type { Browser } from 'puppeteer';

export const testStreamingRouteErrors = (
  getContext: () => { browser: Browser; appPort: number },
) => {
  describe('streaming SSR route errors', () => {
    test.each(['module evaluation', 'chunk request'])(
      'preserves %s errors during client navigation after hydration',
      async failure => {
        const { browser, appPort } = getContext();
        const page = await browser.newPage();
        const networkFailure = failure === 'chunk request';
        const route = networkFailure ? 'network-error' : 'module-error';
        const chunkRequests: string[] = [];
        const documentRequests: string[] = [];
        try {
          await page.evaluateOnNewDocument(() => {
            window.addEventListener('unhandledrejection', event => {
              document.documentElement.setAttribute(
                'data-unhandled-rejection',
                String(event.reason),
              );
            });
          });
          await page.setRequestInterception(true);
          page.on('request', request => {
            if (
              request.isNavigationRequest() &&
              request.frame() === page.mainFrame()
            ) {
              documentRequests.push(request.url());
            }
            if (
              request.resourceType() === 'script' &&
              request.url().includes(`stream-errors_${route}/page`)
            ) {
              chunkRequests.push(request.url());
              if (networkFailure) {
                void request.abort('failed');
                return;
              }
            }
            void request.continue();
          });

          const response = await page.goto(
            `http://localhost:${appPort}/stream-errors`,
          );
          expect(response?.status()).toBe(200);
          // Verify an actual server-rendered page before testing client errors.
          expect(await response?.text()).toContain(
            'class="stream-errors-home"',
          );
          await page.waitForSelector('.stream-errors-home');
          await page.click(`.${route}-link`);
          await page.waitForSelector('.lazy-route-error');

          const error = await page.$eval('.lazy-route-error', element =>
            JSON.parse(element.textContent || '{}'),
          );
          expect(chunkRequests).toHaveLength(1);
          if (networkFailure) {
            expect(error).toEqual({
              name: 'ChunkLoadError',
              message: expect.stringContaining(chunkRequests[0]),
              request: chunkRequests[0],
              type: 'error',
            });
          } else {
            expect(error).toEqual({
              name: 'Error',
              message: 'Route module initialization failed',
              code: 'ROUTE_MODULE_INIT_FAILED',
            });
          }
          expect(new URL(page.url()).pathname).toBe(`/stream-errors/${route}`);
          // A full document navigation must not masquerade as hydration success.
          expect(documentRequests).toHaveLength(1);
          await page.evaluate(
            () => new Promise(resolve => setTimeout(resolve, 0)),
          );
          expect(
            await page.$eval('html', element =>
              element.getAttribute('data-unhandled-rejection'),
            ),
          ).toBeNull();
        } finally {
          await page.close();
        }
      },
    );
  });
};
