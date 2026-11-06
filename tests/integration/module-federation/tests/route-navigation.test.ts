import { describeLab, type LabContext } from './fixture';
const prefix = '/admin/stores/100/inventory';
const main = '[data-testid="route-main"]';
const remoteLocation = `${main} [data-testid="route-remote-location"]`;

async function observeClientRedirects(page: import('puppeteer').Page) {
  await page.evaluateOnNewDocument(() => {
    (window as any).__initialClientLoaderCalls = 0;
    (window as any).__initialRedirectCalls = 0;
    (window as any).__initialClientPops = [];
    window.addEventListener('mf-lab-initial-client-loader', event => {
      (window as any).__initialClientLoaderCalls++;
      if (!(event as CustomEvent).detail.redirect) return;
      (window as any).__initialRedirectCalls++;
      // Stop a broken connector on its second attempt, then fail the assertion.
      if ((window as any).__initialRedirectCalls > 1) event.preventDefault();
    });
    window.addEventListener('popstate', event => {
      if (event.isTrusted)
        (window as any).__initialClientPops.push({
          href: location.href,
          key: event.state?.key,
          idx: event.state?.idx,
        });
    });
  });
}

async function backToClientRedirect(
  { page, lab }: ReturnType<LabContext>,
  initialEntry: { href: string; key?: string; idx: number },
) {
  const destinationRequests: import('puppeteer').HTTPRequest[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  let arrived!: () => void;
  const destinationRequested = new Promise<void>(resolve => {
    arrived = resolve;
  });
  const intercept = async (request: import('puppeteer').HTTPRequest) => {
    const url = new URL(request.url());
    if (
      url.port === String(lab.ports.provider) &&
      url.searchParams.has('__loader') &&
      url.searchParams.get('tab') === 'initial'
    ) {
      destinationRequests.push(request);
      arrived();
      await gate;
    }
    if (!request.isInterceptResolutionHandled())
      await request.continue().catch(() => {});
  };
  await page.setRequestInterception(true);
  page.on('request', intercept);
  try {
    // Hold the destination response while the source POP has already been
    // consumed. Its redirect must not cause the connector to replay that POP.
    await page.evaluate(() => window.history.back());
    await destinationRequested;
    await page.evaluate(
      () =>
        new Promise<void>(resolve => requestAnimationFrame(() => resolve())),
    );
    expect(
      await page.evaluate(() => (window as any).__initialRedirectCalls),
    ).toBe(1);
    const pops = await page.evaluate(() => (window as any).__initialClientPops);
    expect(pops).toHaveLength(1);
    expect(pops[0].href).toBe(initialEntry.href);
    expect(pops[0].key).toBe(initialEntry.key);
    expect(pops[0].idx).toBe(initialEntry.idx);
    release();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="route-remote-location"]')
          ?.textContent === '/detail/42?tab=initial#summary',
    );
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="persistent-host-location"]')
          ?.textContent ===
        '/persistent/inventory/detail/42?tab=initial#summary',
    );
    await page.waitForNetworkIdle({ idleTime: 100 });
    const ids = destinationRequests.map(request =>
      new URL(request.url()).searchParams.get('__loader'),
    );
    expect(ids.filter(id => id === 'product/detail/(id)/page')).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
    for (const request of destinationRequests) {
      expect(request.failure()).toBeNull();
      expect(request.response()?.status()).toBe(200);
    }
  } finally {
    release();
    page.off('request', intercept);
    await page.setRequestInterception(false);
  }
}

describeLab(
  'Modern route-mounted applications',
  getContext => {
    async function visitSSRRoute(
      route: string,
      detailSelector: string,
      expectedLocation?: string,
    ) {
      const { page, lab } = getContext();
      const documents: string[] = [];
      const loaders: string[] = [];
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const observe = async (request: import('puppeteer').HTTPRequest) => {
        const url = new URL(request.url());
        if (
          request.isNavigationRequest() &&
          request.frame() === page.mainFrame()
        )
          documents.push(request.url());
        if (
          url.port === String(lab.ports.provider) &&
          url.searchParams.has('__loader')
        )
          loaders.push(request.url());
        if (
          url.origin === lab.url &&
          /^\/static\/js\/index(?:\.[\w]+)?\.js$/.test(url.pathname)
        )
          await gate;
        if (!request.isInterceptResolutionHandled()) await request.continue();
      };
      await page.setRequestInterception(true);
      page.on('request', observe);
      const firstDocument = page.waitForResponse(
        response =>
          response.request().isNavigationRequest() &&
          response.request().frame() === page.mainFrame(),
      );
      const navigation = page.goto(`${lab.url}/${route}`, {
        waitUntil: 'networkidle0',
      });
      try {
        // The receiver inserts server HTML while the Host entry is still held.
        // Saving the actual page node also detects a Suspense boundary fallback.
        await page.waitForSelector(detailSelector);
        expect(
          await page.evaluate(() => document.documentElement.dataset.labReady),
        ).toBeUndefined();
        if (expectedLocation !== undefined) {
          expect(
            await page.$eval(
              `${detailSelector} [data-testid="route-remote-location"]`,
              node => node.textContent,
            ),
          ).toBe(expectedLocation.replace(/#.*$/, ''));
        }
        await page.evaluate(selector => {
          (window as any).__routeServerDetail =
            document.querySelector(selector);
        }, detailSelector);
        const response = await firstDocument;
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html).toContain('"type":"html"');
        expect(html).toContain(
          expectedLocation === undefined ? 'scope-root' : 'scope-detail',
        );
        release();
        await navigation;
        expect(documents).toHaveLength(1);
        expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
        if (expectedLocation !== undefined) {
          await page.waitForFunction(
            (selector, expected) =>
              document.querySelector(
                `${selector} [data-testid="route-remote-location"]`,
              )?.textContent === expected,
            {},
            detailSelector,
            expectedLocation,
          );
        }
        expect(
          await page.evaluate(
            selector =>
              (window as any).__routeServerDetail ===
              document.querySelector(selector),
            detailSelector,
          ),
        ).toBe(true);
        expect(loaders).toEqual([]);
        return html;
      } finally {
        release();
        await navigation.catch(() => {});
        page.off('request', observe);
        await page.setRequestInterception(false);
      }
    }

    it('restores null SSR data and completes a native POP client-loader redirect once', async () => {
      const { page, click } = getContext();
      await observeClientRedirects(page);
      const html = await visitSSRRoute(
        'admin/persistent/inventory/start',
        '[data-testid="scope-root"]',
      );
      const frames = [
        ...html.matchAll(
          /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
        ),
      ].map(match => JSON.parse(match[1]));
      const snapshot = frames.find(([, frame]) => frame.type === 'ready')?.[1]
        .snapshot;
      expect(snapshot.routerData.loaderData['product/start/page']).toBeNull();
      expect(new URL(page.url()).pathname).toBe(
        '/admin/persistent/inventory/start',
      );
      expect(
        await page.evaluate(() => (window as any).__initialClientLoaderCalls),
      ).toBe(0);
      expect(await page.$('[data-testid="route-remote-location"]')).toBeNull();
      const initialEntry = await page.evaluate(() => ({
        href: location.href,
        key: history.state?.key,
        idx: history.state?.idx,
      }));
      await click('scope-count');
      await click('persistent-stay');
      await page.waitForSelector('[data-testid="scope-detail"]');
      expect(await page.evaluate(() => history.state?.idx)).toBe(
        initialEntry.idx + 1,
      );
      await backToClientRedirect(getContext(), initialEntry);
      expect(
        await page.evaluate(() => (window as any).__initialClientLoaderCalls),
      ).toBe(1);
      expect(
        await page.$eval(
          '[data-testid="scope-count"]',
          node => node.textContent,
        ),
      ).toBe('Observations: 1');
      expect(
        await page.evaluate(
          () =>
            (window as any).__routeServerDetail ===
            document.querySelector('[data-testid="scope-root"]'),
        ),
      ).toBe(true);
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
    });

    it.each(['outside', 'stay'])(
      'cancels Remote loading after a persistent Host navigation (%s)',
      async target => {
        const { page, visit, click, lab } = getContext();
        await visit('admin/persistent/inventory/detail/42', 'scope-detail');
        await click('scope-count');
        const size = await page.evaluate(() => history.length);
        await page.setRequestInterception(true);
        let pending: import('puppeteer').HTTPRequest | undefined;
        let arrived!: () => void;
        const loading = new Promise<void>(resolve => {
          arrived = resolve;
        });
        const intercept = (request: import('puppeteer').HTTPRequest) => {
          const url = new URL(request.url());
          if (
            url.port === String(lab.ports.provider) &&
            url.pathname.includes('/product/detail/slow')
          ) {
            pending = request;
            arrived();
          } else void request.continue();
        };
        page.on('request', intercept);
        try {
          await click('route-remote-slow');
          await loading;
          await click(
            target === 'outside' ? 'persistent-exit' : 'persistent-stay',
          );
          await rstest.waitFor(() =>
            expect(pending?.failure()?.errorText).toBe('net::ERR_ABORTED'),
          );
          const next =
            target === 'outside'
              ? '/persistent/outside'
              : '/persistent/inventory/detail/42';
          expect(new URL(page.url()).pathname).toBe('/admin' + next);
          expect(
            await page.$eval(
              '[data-testid="persistent-host-location"]',
              node => node.textContent,
            ),
          ).toBe(next);
          if (target === 'stay')
            expect(
              await page.$eval(
                '[data-testid="scope-root"]',
                node => node.textContent,
              ),
            ).toContain('Observations: 1');
          expect(await page.evaluate(() => history.length)).toBe(size + 1);
        } finally {
          page.off('request', intercept);
          if (pending && !pending.failure())
            await pending.continue().catch(() => {});
          await page.setRequestInterception(false);
        }
      },
    );

    it('remounts at a new basename and cancels the old instance loading', async () => {
      const { page, visit, click, lab } = getContext();
      await visit(`${prefix.slice(1)}/detail/42`, 'route-remote-location');
      await page.click(`${main} [data-testid="scope-count"]`);
      await page.waitForSelector(
        '[data-testid="route-card-a"] [data-testid="scope-count"]',
      );
      await page.click(
        '[data-testid="route-card-a"] [data-testid="scope-count"]',
      );
      const previousRoot = await page.$(`${main} [data-testid="scope-root"]`);
      expect(previousRoot).not.toBeNull();
      await page.setRequestInterception(true);
      const pending: import('puppeteer').HTTPRequest[] = [];
      let arrived!: () => void;
      const loading = new Promise<void>(resolve => {
        arrived = resolve;
      });
      const intercept = (request: import('puppeteer').HTTPRequest) => {
        const url = new URL(request.url());
        if (
          url.port === String(lab.ports.provider) &&
          url.pathname.includes('/product/detail/slow')
        ) {
          pending.push(request);
          arrived();
        } else void request.continue();
      };
      page.on('request', intercept);
      try {
        await page.click(`${main} [data-testid="route-remote-slow"]`);
        await loading;
        await click('route-host-store');
        await rstest.waitFor(() => {
          expect(pending.length).toBeGreaterThan(0);
          for (const request of pending)
            expect(request.failure()?.errorText).toBe('net::ERR_ABORTED');
        });
        await page.waitForFunction(
          selector =>
            document.querySelector(selector)?.textContent ===
            '/detail/42?tab=stock#summary',
          {},
          remoteLocation,
        );
        expect(new URL(page.url()).pathname).toBe(
          '/admin/stores/200/inventory/detail/42',
        );
        expect(await page.$eval(main, node => node.textContent)).toContain(
          'Observations: 0',
        );
        expect(await previousRoot!.evaluate(node => node.isConnected)).toBe(
          false,
        );
        expect(
          await page.$eval(
            '[data-testid="route-card-a"]',
            node => node.textContent,
          ),
        ).toContain('Observations: 1');
        expect(
          await page.$eval(`${main} [data-testid="scope-product-link"]`, node =>
            node.getAttribute('href'),
          ),
        ).toBe('/admin/stores/200/inventory');
        await page.click(`${main} [data-testid="route-remote-next"]`);
        await page.waitForFunction(
          selector =>
            document.querySelector(selector)?.textContent ===
            '/detail/43?tab=remote#forecast',
          {},
          remoteLocation,
        );
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="route-host-location"]')
              ?.textContent === '/stores/200/inventory/detail/43?tab=remote',
        );
        expect(page.url()).toContain(
          '/admin/stores/200/inventory/detail/43?tab=remote#forecast',
        );
      } finally {
        page.off('request', intercept);
        for (const request of pending)
          if (!request.failure()) await request.continue().catch(() => {});
        await page.setRequestInterception(false);
        await previousRoot?.dispose();
      }
    });

    it('strips an explicit basename case-insensitively without changing encoded loader paths', async () => {
      const { page, lab } = getContext();
      const paths: string[] = [];
      const observe = (request: import('puppeteer').HTTPRequest) => {
        const url = new URL(request.url());
        if (
          url.port === String(lab.ports.provider) &&
          url.pathname.includes('/product/') &&
          url.searchParams.has('__loader')
        )
          paths.push(url.pathname);
      };
      page.on('request', observe);
      try {
        await visitSSRRoute(
          'admin/PERSISTENT/INVENTORY/detail/a%2Fb?tab=stock#summary',
          '[data-testid="scope-detail"]',
          '/detail/a%2Fb?tab=stock#summary',
        );
        expect(
          await page.$eval(
            '[data-testid="scope-detail"]',
            node => node.textContent,
          ),
        ).toContain('Weather station a/b');
        // Initial data comes from the server snapshot. No browser loader URL
        // should be reconstructed from the differently cased consumer prefix.
        expect(paths).toEqual([]);
        expect(page.url()).toContain(
          '/admin/PERSISTENT/INVENTORY/detail/a%2Fb?tab=stock#summary',
        );
        await page.click('[data-testid="route-remote-next"]');
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="route-remote-location"]')
              ?.textContent === '/detail/43?tab=remote#forecast',
        );
        await page.goBack();
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="route-remote-location"]')
              ?.textContent === '/detail/a%2Fb?tab=stock#summary',
        );
        await page.waitForNetworkIdle({ idleTime: 300 });
        // A later browser navigation still uses the producer's data endpoint
        // and preserves the encoded route parameter.
        expect(paths).toContain('/product/detail/a%2Fb');
        expect(paths.some(path => /persistent|inventory/i.test(path))).toBe(
          false,
        );
      } finally {
        page.off('request', observe);
      }
    });

    it('keeps the producer standalone route and relative links unchanged', async () => {
      const { page, lab } = getContext();
      await page.goto(
        `http://localhost:${lab.ports.provider}/product/detail/42?tab=stock`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="scope-detail"]');
      expect(
        await page.$eval(
          '[data-testid="scope-detail"]',
          node => node.textContent,
        ),
      ).toContain('Weather station 42');
      expect(new URL(page.url()).pathname).toBe('/product/detail/42');
      await page.click('[data-testid="scope-product-link"]');
      await page.waitForSelector('[data-testid="scope-product-list"]');
      expect(new URL(page.url()).pathname).toBe('/product');
    });

    it('deep-links with basename, query and hash while keeping memory cards isolated', async () => {
      const { page } = getContext();
      await visitSSRRoute(
        `${prefix.slice(1)}/detail/42?tab=stock#summary`,
        `${main} [data-testid="scope-detail"]`,
        '/detail/42?tab=stock#summary',
      );
      expect(await page.$eval(remoteLocation, node => node.textContent)).toBe(
        '/detail/42?tab=stock#summary',
      );
      expect(
        await page.$eval(`${main} [data-testid="scope-product-link"]`, node =>
          node.getAttribute('href'),
        ),
      ).toBe(prefix);
      await page.waitForSelector(
        '[data-testid="route-card-b"] [data-testid="scope-product-list"]',
      );
      await page.click(
        '[data-testid="route-card-a"] [data-testid="scope-detail-link"]',
      );
      await page.waitForSelector(
        '[data-testid="route-card-a"] [data-testid="scope-detail"]',
      );
      expect(page.url()).toContain(`${prefix}/detail/42?tab=stock#summary`);
      expect(
        await page.$(
          '[data-testid="route-card-b"] [data-testid="scope-product-list"]',
        ),
      ).not.toBeNull();
      expect(
        await page.$(
          '[data-testid="route-orders"] [data-testid="scope-orders"]',
        ),
      ).not.toBeNull();
      await page.click(`${main} [data-testid="scope-product-link"]`);
      await page.waitForSelector(`${main} [data-testid="scope-product-list"]`);
      expect(new URL(page.url()).pathname).toBe(prefix);
    });

    it('treats the selector as the exported root and rejects a repeated selector in the host URL', async () => {
      const { page, visit } = getContext();
      await visit(`${prefix.slice(1)}/product/detail/42`, 'route-main');
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent?.includes('404'),
        {},
        main,
      );
      expect(await page.$(remoteLocation)).toBeNull();
      expect(page.url()).toContain(`${prefix}/product/detail/42`);
      expect(
        await page.$(
          '[data-testid="route-card-b"] [data-testid="scope-product-list"]',
        ),
      ).not.toBeNull();
    });

    it('synchronizes push, replace, both history directions and remote history intent', async () => {
      const { page, visit, click } = getContext();
      await visit(
        `${prefix.slice(1)}/detail/42?tab=stock#summary`,
        'route-remote-location',
      );
      const historySize = await page.evaluate(() => history.length);
      await click('route-host-detail');
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/43?tab=price#chart',
        {},
        remoteLocation,
      );
      expect(await page.evaluate(() => history.length)).toBe(historySize + 1);
      await click('route-host-replace');
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/44?tab=replace#chart',
        {},
        remoteLocation,
      );
      expect(await page.evaluate(() => history.length)).toBe(historySize + 1);
      await page.click(`${main} [data-testid="route-remote-next"]`);
      await page.waitForFunction(
        () =>
          location.pathname.endsWith('/detail/43') &&
          location.search === '?tab=remote' &&
          location.hash === '#forecast',
      );
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="route-host-location"]')
            ?.textContent ===
          location.pathname.replace(/^\/admin/, '') + location.search,
      );
      expect(await page.evaluate(() => history.length)).toBe(historySize + 2);
      await page.click(`${main} [data-testid="route-remote-replace"]`);
      await page.waitForFunction(
        () =>
          location.pathname.endsWith('/detail/44') &&
          location.search === '?tab=remote-replace',
      );
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="route-host-location"]')
            ?.textContent ===
          location.pathname.replace(/^\/admin/, '') + location.search,
      );
      expect(await page.evaluate(() => history.length)).toBe(historySize + 2);
      await page.goBack();
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/44?tab=replace#chart',
        {},
        remoteLocation,
      );
      await page.goForward();
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/44?tab=remote-replace#forecast',
        {},
        remoteLocation,
      );
      await page.click(`${main} [data-testid="route-remote-back"]`);
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/44?tab=replace#chart',
        {},
        remoteLocation,
      );
    });

    it('loads a native history.back destination once without aborting its loader', async () => {
      const { page, lab } = getContext();
      const probe = `native-back-${Date.now()}`;
      const target = `/detail/42?routeProbe=${probe}#summary`;
      await visitSSRRoute(
        `${prefix.slice(1)}${target}`,
        `${main} [data-testid="scope-detail"]`,
        target,
      );
      expect(
        lab.routeRequests.filter(request => request.probe === probe),
      ).toEqual([
        { probe, path: `${prefix}/detail/42`, completed: true, aborted: false },
      ]);
      await page.click(`${main} [data-testid="route-remote-next"]`);
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/43?tab=remote#forecast',
        {},
        remoteLocation,
      );
      const size = await page.evaluate(() => history.length);
      const requests: import('puppeteer').HTTPRequest[] = [];
      const observe = (request: import('puppeteer').HTTPRequest) => {
        const url = new URL(request.url());
        if (
          url.port === String(lab.ports.provider) &&
          url.pathname.includes('/product/detail/42') &&
          url.searchParams.get('routeProbe') === probe
        )
          requests.push(request);
      };
      page.on('request', observe);
      try {
        // Exercise the native POP notification delivered to both real Routers.
        await page.goBack();
        await page.waitForFunction(
          (selector, expected) =>
            document.querySelector(selector)?.textContent === expected,
          {},
          remoteLocation,
          target,
        );
        await page.waitForNetworkIdle({ idleTime: 300 });
        // Ancestor layout loaders use this URL too. Count the destination's
        // loader identity, retaining all repeated requests for that identity.
        const detailRequests = requests.filter(
          request =>
            request.method() === 'GET' &&
            new URL(request.url()).searchParams.get('__loader') ===
              'product/detail/(id)/page',
        );
        expect(detailRequests).toHaveLength(1);
        expect(detailRequests[0].failure()).toBeNull();
        expect(detailRequests[0].response()?.status()).toBe(200);
        expect(
          lab.routeRequests.filter(request => request.probe === probe),
        ).toEqual([
          {
            probe,
            path: `${prefix}/detail/42`,
            completed: true,
            aborted: false,
          },
          {
            probe,
            path: '/product/detail/42',
            completed: true,
            aborted: false,
          },
        ]);
        expect(await page.evaluate(() => history.length)).toBe(size);
        expect(page.url()).toContain(`${prefix}${target}`);
        expect(
          await page.$eval(
            '[data-testid="route-host-location"]',
            node => node.textContent,
          ),
        ).toBe(`/stores/100/inventory/detail/42?routeProbe=${probe}`);
      } finally {
        page.off('request', observe);
      }
    });

    it('preserves state through props and internal navigation, then cleans up on unmount', async () => {
      const { page, visit, click } = getContext();
      await visit(`${prefix.slice(1)}/detail/42`, 'route-remote-location');
      await page.click(`${main} [data-testid="scope-count"]`);
      await click('route-props');
      await page.waitForFunction(
        selector =>
          document
            .querySelector(selector)
            ?.textContent?.includes('Updated store products'),
        {},
        main,
      );
      expect(await page.$eval(main, node => node.textContent)).toContain(
        'Observations: 1',
      );
      expect(
        await page.$eval(`${main} [data-testid="scope-product-link"]`, node =>
          node.getAttribute('href'),
        ),
      ).toBe(prefix);
      await page.click(`${main} [data-testid="route-remote-next"]`);
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          '/detail/43?tab=remote#forecast',
        {},
        remoteLocation,
      );
      expect(new URL(page.url()).pathname).toBe(`${prefix}/detail/43`);
      expect(await page.$eval(main, node => node.textContent)).toContain(
        'Observations: 1',
      );
      await click('route-toggle');
      await page.waitForFunction(
        selector =>
          !document.querySelector(`${selector} [data-testid="scope-root"]`),
        {},
        main,
      );
      await click('route-host-detail');
      await click('route-toggle');
      await page.waitForSelector(remoteLocation);
      expect(await page.$eval(main, node => node.textContent)).toContain(
        'Observations: 0',
      );
      expect(await page.$eval(remoteLocation, node => node.textContent)).toBe(
        '/detail/43?tab=price#chart',
      );
    });

    it('aborts an in-flight loader when its instance is unmounted', async () => {
      const { page, visit, click, lab } = getContext();
      await visit(`${prefix.slice(1)}/detail/42`, 'route-remote-location');
      await page.setRequestInterception(true);
      let release!: () => Promise<void>;
      const loading = new Promise<void>(resolve => {
        page.on('request', request => {
          const url = new URL(request.url());
          if (
            url.port === String(lab.ports.provider) &&
            url.pathname.includes('/product/detail/slow')
          ) {
            release = () => request.continue();
            resolve();
          } else void request.continue();
        });
      });
      const aborted = page.waitForRequest(request =>
        request.url().includes('/product/detail/slow'),
      );
      await click('route-host-slow');
      await loading;
      const pending = await aborted;
      const failed = new Promise<void>(resolve =>
        page.on('requestfailed', request => {
          if (request === pending) resolve();
        }),
      );
      await click('route-toggle');
      await failed;
      expect(pending.failure()?.errorText).toBe('net::ERR_ABORTED');
      await page.waitForFunction(
        selector =>
          !document.querySelector(`${selector} [data-testid="scope-root"]`),
        {},
        main,
      );
      await click('route-host-detail');
      await click('route-toggle');
      await page.waitForSelector(remoteLocation);
      expect(await page.$eval(remoteLocation, node => node.textContent)).toBe(
        '/detail/43?tab=price#chart',
      );
      // The fetch is already cancelled, so its interception no longer needs releasing.
      expect(typeof release).toBe('function');
    });

    it('retries a failed provider without affecting independent mounts', async () => {
      const { page, visit } = getContext();
      await visit(
        'admin/stores/100/retry/detail/42?tab=stock#summary',
        'route-retry',
      );
      expect(
        await page.$eval(
          '[data-testid="route-retry"]',
          node => node.textContent,
        ),
      ).toContain('Weather route mount failed once');
      await page.click('[data-testid="route-retry"]');
      await page.waitForSelector(remoteLocation);
      expect(await page.$eval(remoteLocation, node => node.textContent)).toBe(
        '/detail/42?tab=stock#summary',
      );
      expect(
        await page.$(
          '[data-testid="route-card-b"] [data-testid="scope-product-list"]',
        ),
      ).not.toBeNull();
    });
  },
  { basename: '/admin' },
);

describeLab(
  'Immediate client-loader redirects',
  getContext => {
    it('notifies the Host after an initial client loader redirect', async () => {
      const { page, visit } = getContext();
      await visit('admin/persistent/inventory/start', 'route-remote-location');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="route-remote-location"]')
            ?.textContent === '/detail/42?tab=initial#summary',
      );
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="persistent-host-location"]')
            ?.textContent ===
          '/persistent/inventory/detail/42?tab=initial#summary',
      );
      expect(page.url()).toContain(
        '/admin/persistent/inventory/detail/42?tab=initial#summary',
      );
    });

    it('notifies the Host while a lazy loading component delays the Remote commit', async () => {
      const { page, lab } = getContext();
      await page.setRequestInterception(true);
      let pending: import('puppeteer').HTTPRequest | undefined;
      const intercept = (request: import('puppeteer').HTTPRequest) => {
        if (
          request.url().includes('initial-loading') &&
          request.resourceType() === 'script'
        )
          pending = request;
        else void request.continue();
      };
      page.on('request', intercept);
      try {
        await page.goto(`${lab.url}/admin/persistent/inventory/start`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForFunction(
          () => location.pathname === '/admin/persistent/inventory/detail/42',
        );
        expect(pending).toBeDefined();
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="persistent-host-location"]')
              ?.textContent ===
            '/persistent/inventory/detail/42?tab=initial#summary',
        );
        await pending!.continue();
        pending = undefined;
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="route-remote-location"]')
              ?.textContent === '/detail/42?tab=initial#summary',
        );
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="persistent-host-location"]')
              ?.textContent ===
            '/persistent/inventory/detail/42?tab=initial#summary',
        );
        expect(page.url()).toContain(
          '/admin/persistent/inventory/detail/42?tab=initial#summary',
        );
      } finally {
        page.off('request', intercept);
        if (pending) await pending.continue().catch(() => {});
        await page.setRequestInterception(false);
      }
    });
    it.each(['adapter', 'direct'])(
      'notifies the Browser Host before a separate-root consumer commits (%s)',
      async variant => {
        const { page, lab } = getContext();
        await page.setRequestInterception(true);
        let pending: import('puppeteer').HTTPRequest | undefined;
        const intercept = (request: import('puppeteer').HTTPRequest) => {
          if (
            request.url().includes('initial-loading') &&
            request.resourceType() === 'script'
          )
            pending = request;
          else void request.continue();
        };
        page.on('request', intercept);
        const mount = `/browser-consumer/${variant}`;
        try {
          await page.goto(`${lab.url}/admin${mount}/start`, {
            waitUntil: 'domcontentloaded',
          });
          await page.waitForFunction(
            expected => location.pathname === expected,
            {},
            `/admin${mount}/detail/42`,
          );
          expect(pending).toBeDefined();
          // The Host must receive the already committed history write even
          // when there is no Modern adapter or no navigation adapter at all.
          await page.waitForFunction(
            expected =>
              document.querySelector(
                '[data-testid="browser-consumer-host-location"]',
              )?.textContent === expected,
            {},
            `${mount}/detail/42?tab=initial#summary`,
          );
          await pending!.continue();
          pending = undefined;
          await page.waitForFunction(
            () =>
              document.querySelector(
                '[data-testid="browser-consumer-remote"] [data-testid="route-remote-location"]',
              )?.textContent === '/detail/42?tab=initial#summary',
          );
          expect(page.url()).toContain(
            `/admin${mount}/detail/42?tab=initial#summary`,
          );
        } finally {
          page.off('request', intercept);
          if (pending) await pending.continue().catch(() => {});
          await page.setRequestInterception(false);
        }
      },
    );
  },
  { basename: '/admin', clientLayoutLoaders: true, initialRouteNoSSR: true },
);

for (const hash of [false, true])
  describeLab(
    `Native POP client-loader redirects without SSR (${hash ? 'Hash' : 'Browser'})`,
    getContext => {
      it('consumes the source entry once when a conditional loader redirects', async () => {
        const { page, lab, click } = getContext();
        await observeClientRedirects(page);
        const documents: string[] = [];
        page.on('request', request => {
          if (
            request.isNavigationRequest() &&
            request.frame() === page.mainFrame()
          )
            documents.push(request.url());
        });
        const mount = `${lab.url}/${hash ? '#/' : ''}admin/persistent/inventory`;
        await page.goto(`${mount}/start`, { waitUntil: 'networkidle0' });
        await page.waitForSelector('[data-testid="scope-root"]');
        expect(
          await page.evaluate(() => (window as any).__initialClientLoaderCalls),
        ).toBe(1);
        expect(
          await page.evaluate(() => (window as any).__initialRedirectCalls),
        ).toBe(0);
        expect(page.url()).toBe(`${mount}/start`);
        const initialEntry = await page.evaluate(() => {
          (window as any).__initialRemoteRoot = document.querySelector(
            '[data-testid="scope-root"]',
          );
          return {
            href: location.href,
            key: history.state?.key,
            idx: history.state?.idx,
          };
        });
        await click('scope-count');
        await click('persistent-stay');
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="route-remote-location"]')
              ?.textContent === '/detail/42',
        );
        expect(page.url()).toBe(`${mount}/detail/42`);
        expect(await page.evaluate(() => history.state?.idx)).toBe(
          initialEntry.idx + 1,
        );
        expect(await page.evaluate(() => history.state?.key)).not.toBe(
          initialEntry.key,
        );
        // The business condition changes after the first visit. History itself
        // remains the two entries created by the real Routers above.
        await page.evaluate(() =>
          sessionStorage.setItem('mf-lab-redirect-enabled', 'true'),
        );
        await backToClientRedirect(getContext(), initialEntry);
        expect(
          await page.evaluate(() => (window as any).__initialClientLoaderCalls),
        ).toBe(2);
        expect(
          await page.evaluate(
            () =>
              (window as any).__initialRemoteRoot ===
              document.querySelector('[data-testid="scope-root"]'),
          ),
        ).toBe(true);
        expect(
          await page.$eval(
            '[data-testid="scope-count"]',
            node => node.textContent,
          ),
        ).toBe('Observations: 1');
        expect(page.url()).toBe(`${mount}/detail/42?tab=initial#summary`);
        expect(documents).toHaveLength(1);
      });
    },
    {
      basename: '/admin',
      hash,
      initialRouteNoSSR: true,
      conditionalClientRedirect: true,
    },
  );

for (const documentBase of [undefined, '/'])
  describeLab(
    `Modern Hash Router application mounts (Document base: ${documentBase ?? 'none'})`,
    getContext => {
      it('uses logical locations for deep links, remote navigation and browser history', async () => {
        const { page, lab } = getContext();
        await page.goto(
          `${lab.url}/#/admin/stores/100/inventory/detail/42?tab=stock#summary`,
          { waitUntil: 'networkidle0' },
        );
        await page.waitForSelector(remoteLocation);
        if (documentBase)
          expect(
            await page.$eval('base', node => node.getAttribute('href')),
          ).toBe(documentBase);
        expect(await page.$eval(remoteLocation, node => node.textContent)).toBe(
          '/detail/42?tab=stock#summary',
        );
        expect(
          await page.$eval(`${main} [data-testid="scope-product-link"]`, node =>
            node.getAttribute('href'),
          ),
        ).toBe(
          documentBase
            ? `${lab.url}/#/admin/stores/100/inventory`
            : '#/admin/stores/100/inventory',
        );
        await page.click(`${main} [data-testid="route-remote-next"]`);
        await page.waitForFunction(
          () =>
            location.hash ===
            '#/admin/stores/100/inventory/detail/43?tab=remote#forecast',
        );
        await page.goBack();
        await page.waitForFunction(
          selector =>
            document.querySelector(selector)?.textContent ===
            '/detail/42?tab=stock#summary',
          {},
          remoteLocation,
        );
        await page.click('[data-testid="route-host-detail"]');
        await page.waitForFunction(
          selector =>
            document.querySelector(selector)?.textContent ===
            '/detail/43?tab=price#chart',
          {},
          remoteLocation,
        );
      });
    },
    { basename: '/admin', hash: true, documentBase },
  );
