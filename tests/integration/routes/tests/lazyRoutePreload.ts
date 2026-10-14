import type { Browser, HTTPRequest, Page } from 'puppeteer';

const setupPreloadFailure = async (page: Page) => {
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
      if (error instanceof Error && error.name === 'ChunkLoadError') {
        document.documentElement.setAttribute(
          'data-preload-error',
          JSON.stringify({
            name: error.name,
            message: error.message,
            request: 'request' in error ? error.request : undefined,
          }),
        );
      }
      logError(...args);
    };
  });

  const chunkRequests: string[] = [];
  let holdData!: (request: HTTPRequest) => void;
  const firstDataRequest = new Promise<HTTPRequest>(resolve => {
    holdData = resolve;
  });
  let dataRequests = 0;
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/__lazy-route-data') {
      if (dataRequests++ === 0) {
        holdData(request);
      } else {
        void request.respond({ status: 200, body: 'route data' });
      }
    } else if (
      request.resourceType() === 'script' &&
      request.url().includes('lazy-errors_preload-retry/page')
    ) {
      chunkRequests.push(request.url());
      if (chunkRequests.length === 1) {
        void request.abort('failed');
      } else {
        void request.continue();
      }
    } else {
      void request.continue();
    }
  });

  return {
    chunkRequests,
    async releaseData() {
      const request = await firstDataRequest;
      await request.respond({ status: 200, body: 'route data' });
    },
  };
};

const expectHandledPreloadFailure = async (page: Page) => {
  // Observe the real import rejection before allowing React to render.
  await page.waitForSelector('html[data-preload-error]');
  expect(await page.$('.lazy-errors-home')).not.toBeNull();
  expect(await page.$('.lazy-route-error')).toBeNull();
  // Give unhandledrejection dispatch a turn while the data request stays held.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await expectNoUnhandledRejections(page);
};

const expectNoUnhandledRejections = async (page: Page) => {
  expect(
    await page.$eval('html', element =>
      element.getAttribute('data-unhandled-rejection'),
    ),
  ).toBeNull();
};

export const testLazyRoutePreload = (
  getContext: () => { browser: Browser; appPort: number },
) => {
  describe('lazy route preload recovery', () => {
    test.each(['cancelled navigation', 'background fetch'])(
      'retries an unconsumed chunk failure after %s',
      async scenario => {
        const { browser, appPort } = getContext();
        const page = await browser.newPage();
        try {
          const { chunkRequests, releaseData } =
            await setupPreloadFailure(page);
          await page.goto(`http://localhost:${appPort}/lazy-errors`);
          await page.waitForSelector('.lazy-errors-home');
          await page.click(
            scenario === 'background fetch'
              ? '.fetch-route-data'
              : '.preload-retry-link',
          );
          await expectHandledPreloadFailure(page);

          if (scenario === 'background fetch') {
            await releaseData();
            await page.waitForSelector('.route-fetcher[data-state="idle"]');
          } else {
            await page.click('.lazy-home-link');
            await page.waitForSelector(
              '.lazy-route-status[data-pathname="/"][data-navigation-state="idle"]',
            );
          }

          // The first request was aborted; the network now allows the retry.
          await page.click('.preload-retry-link');
          await page.waitForSelector('.preload-retry-page', { timeout: 5000 });
          expect(chunkRequests).toHaveLength(2);
          expect(await page.$('.lazy-route-error')).toBeNull();
          await expectNoUnhandledRejections(page);
        } finally {
          await page.close();
        }
      },
    );

    test('preserves the first preload error when the same navigation renders', async () => {
      const { browser, appPort } = getContext();
      const page = await browser.newPage();
      try {
        const { chunkRequests, releaseData } = await setupPreloadFailure(page);
        await page.goto(`http://localhost:${appPort}/lazy-errors`);
        await page.waitForSelector('.lazy-errors-home');
        await page.click('.preload-retry-link');
        await expectHandledPreloadFailure(page);
        const originalError = await page.$eval('html', element =>
          JSON.parse(element.getAttribute('data-preload-error')!),
        );

        await releaseData();
        await page.waitForSelector('.lazy-route-error');
        const error = await page.$eval('.lazy-route-error', element =>
          JSON.parse(element.textContent || '{}'),
        );
        expect(error).toEqual({ ...originalError, type: 'error' });
        expect(chunkRequests).toHaveLength(1);
        await expectNoUnhandledRejections(page);
      } finally {
        await page.close();
      }
    });
  });
};
