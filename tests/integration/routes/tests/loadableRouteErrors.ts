import type { Browser, HTTPRequest, Page } from 'puppeteer';

const observeErrors = async (page: Page) => {
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', event => {
      document.documentElement.setAttribute(
        'data-unhandled-rejection',
        String(event.reason),
      );
    });
    const logError = console.error;
    console.error = (...args: unknown[]) => {
      const error = args[0];
      if (
        error instanceof Error &&
        (error.name === 'ChunkLoadError' ||
          ('code' in error && error.code === 'CSS_CHUNK_LOAD_FAILED') ||
          ('code' in error && error.code === 'ROUTE_MODULE_INIT_FAILED'))
      ) {
        document.documentElement.setAttribute('data-loadable-error', 'true');
      }
      logError(...args);
    };
  });
};

const expectNoUnhandledRejections = async (page: Page) => {
  // Allow unhandledrejection dispatch, including before React starts rendering.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  expect(
    await page.$eval('html', element =>
      element.getAttribute('data-unhandled-rejection'),
    ),
  ).toBeNull();
};

export const testLoadableRouteErrors = (
  getContext: () => { browser: Browser; appPort: number },
) => {
  describe('string SSR loadable route errors', () => {
    test('renders server HTML and hydrates with route styles', async () => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      try {
        const response = await page.goto(
          `http://localhost:${appPort}/loadable-errors`,
        );
        expect(response?.status()).toBe(200);
        expect(await response?.text()).toContain('class="loadable-home"');
        await page.waitForSelector('.loadable-home');
        expect(
          await page.$eval('.loadable-home', element =>
            getComputedStyle(element).getPropertyValue('color'),
          ),
        ).toBe('rgb(12, 34, 56)');
        // A working client transition also verifies hydration and chunk metadata.
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (new URL(request.url()).pathname === '/__loadable-route-data') {
            void request.respond({ status: 200, body: 'route data' });
          } else {
            void request.continue();
          }
        });
        await page.click('.network-error-link');
        await page.waitForSelector('.network-error-page');
        expect(await page.$('.lazy-route-error')).toBeNull();
      } finally {
        await page.close();
      }
    });

    test.each([
      'module failure before rendering',
      'module failure while rendering',
      'module failure on revisit',
      'module failure after network retry',
      'successful network retry',
      'failed network retry',
      'successful stylesheet retry',
      'failed stylesheet retry',
      'cancelled navigation',
      'background fetch',
      'network recovery after error boundary',
    ])('%s', async scenario => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      const moduleFailure = scenario.startsWith('module');
      const moduleRetry = scenario === 'module failure after network retry';
      const stylesheet = scenario.includes('stylesheet');
      const route = moduleFailure ? 'module-error' : 'network-error';
      const holdChunk = scenario === 'module failure while rendering';
      const remount = scenario === 'network recovery after error boundary';
      const failsRetry = scenario.startsWith('failed');
      const succeeds = !moduleFailure && !failsRetry;
      const chunkRequests: string[] = [];
      const documentRequests: string[] = [];
      let dataRequests = 0;
      let holdData!: (request: HTTPRequest) => void;
      let releaseChunk!: (request: HTTPRequest) => void;
      const firstData = new Promise<HTTPRequest>(resolve => {
        holdData = resolve;
      });
      const firstChunk = new Promise<HTTPRequest>(resolve => {
        releaseChunk = resolve;
      });
      try {
        await observeErrors(page);
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (
            request.isNavigationRequest() &&
            request.frame() === page.mainFrame()
          ) {
            documentRequests.push(request.url());
          }
          if (new URL(request.url()).pathname === '/__loadable-route-data') {
            if (dataRequests++ === 0) {
              holdData(request);
            } else {
              void request.respond({ status: 200, body: 'route data' });
            }
          } else if (
            request.resourceType() === (stylesheet ? 'stylesheet' : 'script') &&
            request.url().includes(`loadable-errors_${route}/page`)
          ) {
            chunkRequests.push(request.url());
            if (holdChunk) {
              releaseChunk(request);
            } else if (
              (moduleRetry && chunkRequests.length === 1) ||
              (!moduleFailure &&
                (chunkRequests.length === 1 ||
                  failsRetry ||
                  (remount && chunkRequests.length <= 2)))
            ) {
              void request.abort('failed');
            } else {
              void request.continue();
            }
          } else {
            void request.continue();
          }
        });
        await page.goto(`http://localhost:${appPort}/loadable-errors`);
        await page.waitForSelector('.loadable-home');
        await page.click(
          scenario === 'background fetch'
            ? '.fetch-loadable-data'
            : `.${route}-link`,
        );
        const dataRequest = await firstData;
        if (holdChunk) {
          const chunkRequest = await firstChunk;
          await dataRequest.respond({ status: 200, body: 'route data' });
          await page.waitForSelector('.lazy-route-loading');
          await page.waitForSelector(
            '.loadable-route-status[data-pathname="/module-error"][data-navigation-state="idle"]',
          );
          await chunkRequest.continue();
        } else {
          await page.waitForSelector('html[data-loadable-error]');
          expect(await page.$('.loadable-home')).not.toBeNull();
          expect(await page.$('.lazy-route-error')).toBeNull();
          await expectNoUnhandledRejections(page);
          if (scenario === 'cancelled navigation') {
            await page.click('.loadable-home-link');
            await page.waitForSelector(
              '.loadable-route-status[data-pathname="/"][data-navigation-state="idle"]',
            );
            await page.click('.network-error-link');
          } else {
            await dataRequest.respond({ status: 200, body: 'route data' });
            if (scenario === 'background fetch') {
              await page.waitForSelector(
                '.loadable-fetcher[data-state="idle"]',
              );
              await page.click('.network-error-link');
            }
          }
        }

        if (remount) {
          await page.waitForSelector('.lazy-route-error');
          expect(chunkRequests).toHaveLength(2);
          await page.click('.loadable-home-link');
          await page.waitForSelector('.loadable-home');
          await page.click('.network-error-link');
        }
        await page.waitForSelector(
          succeeds ? '.network-error-page' : '.lazy-route-error',
        );
        if (scenario === 'module failure on revisit' || moduleRetry) {
          await page.click('.loadable-home-link');
          await page.waitForSelector('.loadable-home');
          await page.click('.module-error-link');
          await page.waitForSelector('.lazy-route-error');
        }
        if (succeeds) {
          expect(await page.$('.lazy-route-error')).toBeNull();
          expect(chunkRequests).toHaveLength(remount ? 3 : 2);
          expect(
            await page.$eval('.network-error-page', element =>
              getComputedStyle(element).getPropertyValue('color'),
            ),
          ).toBe('rgb(56, 34, 12)');
        } else {
          const error = await page.$eval('.lazy-route-error', element =>
            JSON.parse(element.textContent || '{}'),
          );
          if (moduleFailure) {
            expect(error).toEqual({
              name: 'Error',
              message: 'Route module initialization failed',
              code: 'ROUTE_MODULE_INIT_FAILED',
            });
          } else {
            expect(chunkRequests).toHaveLength(2);
            expect(error).toMatchObject({
              ...(stylesheet
                ? { code: 'CSS_CHUNK_LOAD_FAILED' }
                : { name: 'ChunkLoadError' }),
              message: expect.stringContaining(chunkRequests[1]),
              request: chunkRequests[1],
              type: 'error',
            });
          }
        }
        expect(documentRequests).toHaveLength(1);
        await expectNoUnhandledRejections(page);
      } finally {
        await page.close();
      }
    });
  });
};
