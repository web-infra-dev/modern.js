import type { Browser, HTTPRequest, Page } from 'puppeteer';

const trackUnhandledRejections = async (page: Page) => {
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', event => {
      document.documentElement.setAttribute(
        'data-unhandled-rejection',
        String(event.reason),
      );
    });
  });
};

const expectNoUnhandledRejections = async (page: Page) => {
  expect(
    await page.$eval('html', element =>
      element.getAttribute('data-unhandled-rejection'),
    ),
  ).toBeNull();
};

export const testLazyRouteErrors = (
  getContext: () => { browser: Browser; appPort: number },
) => {
  describe('lazy route errors', () => {
    test('commits navigation and shows loading while the route chunk is pending', async () => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      let heldRequest: HTTPRequest | undefined;
      let onRequest!: (request: HTTPRequest) => void;
      const requestStarted = new Promise<HTTPRequest>(resolve => {
        onRequest = resolve;
      });
      try {
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (
            request.resourceType() === 'script' &&
            request.url().includes('lazy-errors_network-error/page')
          ) {
            heldRequest = request;
            onRequest(request);
          } else {
            void request.continue();
          }
        });
        await page.goto(`http://localhost:${appPort}/lazy-errors`);
        await page.waitForSelector('.lazy-errors-home');
        await page.click('.network-error-link');
        const request = await requestStarted;

        // Keep the chunk pending while checking the existing Suspense behavior.
        await page.waitForSelector('.lazy-route-loading', { timeout: 5000 });
        expect(
          await page.$eval('.lazy-route-status', element => ({
            pathname: element.getAttribute('data-pathname'),
            navigationState: element.getAttribute('data-navigation-state'),
          })),
        ).toEqual({
          pathname: '/network-error',
          navigationState: 'idle',
        });
        expect(new URL(page.url()).pathname).toBe('/lazy-errors/network-error');
        expect(await page.$('.network-error-page')).toBeNull();

        await request.continue();
        heldRequest = undefined;
        await page.waitForSelector('.network-error-page');
        expect(await page.$('.lazy-route-loading')).toBeNull();
      } finally {
        if (heldRequest) {
          await heldRequest.abort();
        }
        await page.close();
      }
    });

    test('renders a route when its chunk loads successfully', async () => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      try {
        await page.goto(`http://localhost:${appPort}/lazy-errors`);
        await page.waitForSelector('.lazy-errors-home');
        await page.click('.network-error-link');
        await page.waitForSelector('.network-error-page');
        expect(await page.$('.lazy-route-error')).toBeNull();
      } finally {
        await page.close();
      }
    });

    test('passes module evaluation errors to the route error boundary', async () => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      try {
        await trackUnhandledRejections(page);
        await page.goto(`http://localhost:${appPort}/lazy-errors`);
        await page.waitForSelector('.lazy-errors-home');
        await page.click('.module-error-link');
        await page.waitForSelector('.lazy-route-error');
        const error = await page.$eval('.lazy-route-error', element =>
          JSON.parse(element.textContent || '{}'),
        );
        expect(error).toEqual({
          name: 'Error',
          message: 'Route module initialization failed',
          code: 'ROUTE_MODULE_INIT_FAILED',
        });
        await expectNoUnhandledRejections(page);
      } finally {
        await page.close();
      }
    });

    test('passes chunk request failures to the route error boundary', async () => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      const blockedRequests: string[] = [];
      try {
        await trackUnhandledRejections(page);
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (
            request.resourceType() === 'script' &&
            request.url().includes('lazy-errors_network-error/page')
          ) {
            blockedRequests.push(request.url());
            void request.abort('failed');
          } else {
            void request.continue();
          }
        });

        await page.goto(`http://localhost:${appPort}/lazy-errors`);
        await page.waitForSelector('.lazy-errors-home');
        await page.click('.network-error-link');
        await page.waitForSelector('.lazy-route-error');
        const error = await page.$eval('.lazy-route-error', element =>
          JSON.parse(element.textContent || '{}'),
        );
        expect(blockedRequests).toHaveLength(1);
        expect(error).toEqual({
          name: 'ChunkLoadError',
          message: expect.stringContaining('Loading chunk'),
          request: blockedRequests[0],
          type: 'error',
        });
        expect(error.message).toContain(blockedRequests[0]);
        expect(await page.$('.network-error-page')).toBeNull();
        await expectNoUnhandledRejections(page);
      } finally {
        await page.close();
      }
    });
  });
};
