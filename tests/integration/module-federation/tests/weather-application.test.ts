import { describeLab } from './fixture';

describeLab(
  'Routed weather application',
  getContext => {
    it('opens the core application from the homepage and fits a phone viewport', async () => {
      const { lab, page } = getContext();
      await page.setViewport({ width: 390, height: 844 });
      await page.goto(lab.url, { waitUntil: 'networkidle0' });
      expect(await page.$$('iframe')).toHaveLength(2);
      await page.click('a[href="/bridge-ssr"]');
      await page.waitForSelector('[data-testid="weather-overview"]');
      expect(
        await page.$eval(
          '[data-testid="weather-current"] h1',
          node => node.textContent,
        ),
      ).toBe('Hangzhou');
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 1280, height: 598 },
      ]) {
        await page.setViewport(viewport);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await page.$eval('.current-temperature', node =>
            Number.parseFloat(getComputedStyle(node).fontSize),
          ),
        ).toBeGreaterThanOrEqual(64);
        // Host and Remote styles can arrive in either order. The iframe's
        // one-screen layout must not clip a complete, scrollable application.
        expect(
          await page.evaluate(() => {
            const scene = document.querySelector('.weather-application')!;
            const footer = document.querySelector('.weather-app-footer')!;
            return (
              footer.getBoundingClientRect().bottom <=
              scene.getBoundingClientRect().bottom
            );
          }),
        ).toBe(true);
        expect(
          await page.$eval(
            '.air-weather',
            node => getComputedStyle(node).display,
          ),
        ).not.toBe('none');
      }
    });
    it('keeps the public demo focused and serves the producer application independently', async () => {
      const { lab, page } = getContext();
      for (const route of [
        'bridge-stream',
        'route-exports',
        'bridge-failure',
        'input-forms',
        'bridge-inputs',
        'weather-instances',
      ]) {
        expect((await fetch(`${lab.url}/${route}`)).status).toBe(404);
      }
      await page.goto(
        `http://localhost:${lab.ports.provider}/weather-application/forecast/wed`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector(
        '[data-testid="weather-detail"][data-day="wed"]',
      );
      expect(
        await page.$eval(
          '[data-testid="outlook-resolved"]',
          node => node.textContent,
        ),
      ).toContain('umbrella');
      expect(
        await page.$eval(
          '.weather-scene',
          node => getComputedStyle(node).backgroundImage,
        ),
      ).toContain('linear-gradient');
      expect(
        await page.$eval(
          '.sky-cloud',
          node => getComputedStyle(node).backgroundImage,
        ),
      ).toContain('.svg');
      await page.click('nav[aria-label="Weather pages"] a[href$="/overview"]');
      await page.waitForSelector('[data-testid="weather-overview"]');
    });

    it('navigates, filters, saves and retains selections through host history and props changes', async () => {
      const { lab, page, click } = getContext();
      await page.goto(`${lab.url}/bridge-ssr`, { waitUntil: 'networkidle0' });
      await click('weather-save');
      await page.click('.hours button:nth-child(3)');
      await page.$eval('input[aria-label="Adjust wind direction"]', node => {
        const input = node as HTMLInputElement;
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )!.set!.call(input, '120');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.click('nav[aria-label="Weather pages"] a[href$="/forecast"]');
      await page.waitForSelector('[data-testid="weather-forecast"]');
      expect(new URL(page.url()).pathname).toBe('/bridge-ssr/forecast');
      await page.select('select[aria-label="Filter forecast"]', 'showers');
      expect(await page.$('[data-testid="forecast-today"]')).toBeNull();
      await click('forecast-wed');
      await page.waitForSelector('[data-testid="outlook-resolved"]');
      expect(new URL(page.url()).pathname).toBe('/bridge-ssr/forecast/wed');
      expect(
        await page.$eval('.hours button:nth-child(3)', node =>
          node.getAttribute('aria-pressed'),
        ),
      ).toBe('true');
      expect(
        await page.$eval(
          '[data-testid="wind-angle"]',
          node => node.textContent,
        ),
      ).toBe('120°');
      await click('save-day');
      await page.click('nav[aria-label="Weather pages"] a[href$="/favorites"]');
      await page.waitForSelector('[data-testid="weather-favorites"]');
      expect(
        await page.$eval(
          '[data-testid="weather-favorites"]',
          node => node.textContent,
        ),
      ).toContain('Wed');
      expect(
        await page.$eval(
          '[data-testid="favorite-count"]',
          node => node.textContent,
        ),
      ).toBe('2');
      await page.goBack();
      await page.waitForSelector('[data-testid="weather-detail"]');
      expect(
        await page.$eval('[data-testid="save-day"]', node =>
          node.getAttribute('aria-pressed'),
        ),
      ).toBe('true');
      await page.goBack();
      await page.waitForSelector('[data-testid="weather-forecast"]');
      expect(
        await page.$eval('select', node => (node as HTMLSelectElement).value),
      ).toBe('showers');
      await page.goForward();
      await page.waitForSelector('[data-testid="weather-detail"]');
      await page.click('.weather-host-controls summary');
      await click('application-rename');
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="weather-detail"] h2')
          ?.textContent?.includes('West Lake'),
      );
      expect(
        await page.$eval(
          '[data-testid="favorite-count"]',
          node => node.textContent,
        ),
      ).toBe('2');
    });

    it('renders styled deep-link SSR before host JavaScript and hydrates the same DOM without re-fetching', async () => {
      const { lab, page } = getContext();
      const probe = `weather-ssr-${Date.now()}`;
      const browserLoaders: string[] = [];
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      await page.setRequestInterception(true);
      page.on('request', async request => {
        const url = new URL(request.url());
        if (url.searchParams.has('__loader'))
          browserLoaders.push(request.url());
        if (
          /^\/static\/js\/index(?:\.[\w]+)?\.js$/.test(url.pathname) &&
          url.port === String(lab.ports.host)
        )
          await gate;
        if (!request.isInterceptResolutionHandled()) await request.continue();
      });
      const navigation = page.goto(
        `${lab.url}/bridge-ssr/forecast/wed?probe=${probe}`,
        { waitUntil: 'domcontentloaded' },
      );
      try {
        await page.waitForSelector('[data-testid="outlook-resolved"]');
        expect(
          await page.$eval(
            '.hours button',
            node => (node as HTMLButtonElement).disabled,
          ),
        ).toBe(true);
        expect(
          await page.$eval(
            '.weather-scene',
            node => getComputedStyle(node).backgroundImage,
          ),
        ).toContain('linear-gradient');
        expect(
          await page.$eval(
            '.weather-card',
            node => getComputedStyle(node).borderRadius,
          ),
        ).toBe('15px');
        await page.evaluate(() => {
          (window as any).__weatherServerNodes = [
            ...document.querySelectorAll(
              '[data-testid="weather-application"], [data-testid="weather-detail"], [data-testid="outlook-resolved"]',
            ),
          ];
        });
        release();
        await navigation;
        await page.waitForSelector('.hours button:not(:disabled)');
        expect(
          await page.evaluate(() =>
            (window as any).__weatherServerNodes.every(
              (node: Element) => node.isConnected,
            ),
          ),
        ).toBe(true);
        expect(browserLoaders).toEqual([]);
        expect(
          lab.bridgeRequests.filter(item => item.probe === probe),
        ).toHaveLength(1);
      } finally {
        release();
        await navigation;
      }
    });

    it('keeps detail controls interactive during a real deferred request, then recovers a failed request', async () => {
      const { lab, page, click } = getContext();
      const probe = `weather-pending-${Date.now()}`;
      const navigation = page.goto(
        `${lab.url}/bridge-ssr/forecast/today?probe=${probe}&hold=1`,
        { waitUntil: 'domcontentloaded' },
      );
      try {
        await page.waitForSelector('[data-testid="outlook-pending"]');
        await page.waitForSelector('.hours button:not(:disabled)');
        await click('save-day');
        await page.click('.hours button:nth-child(2)');
        expect(
          await page.$eval(
            '[data-testid="favorite-count"]',
            node => node.textContent,
          ),
        ).toBe('1');
        expect(lab.bridgeRequests.filter(item => item.probe === probe)).toEqual(
          [{ probe, completed: false, aborted: false }],
        );
        lab.releaseBridge(probe);
        await navigation;
        await page.waitForSelector('[data-testid="outlook-resolved"]');
        expect(
          await page.$eval('.hours button:nth-child(2)', node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
        await page.click('.weather-app-service summary');
        await click('outlook-fail');
        await page.waitForSelector('[data-testid="outlook-error"]');
        await click('outlook-retry');
        await page.waitForSelector('[data-testid="outlook-resolved"]');
        expect(
          lab.bridgeRequests.filter(item => item.probe === probe),
        ).toHaveLength(3);
        expect(
          await page.$eval('[data-testid="save-day"]', node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
      } finally {
        lab.releaseBridge(probe);
        await navigation;
      }
    });

    it('cancels an initially streamed outlook when its hydrated page is left', async () => {
      const { lab, page, click } = getContext();
      const probe = `weather-ssr-cancel-${Date.now()}`;
      const navigation = page.goto(
        `${lab.url}/bridge-ssr/forecast/today?probe=${probe}&hold=1`,
        { waitUntil: 'domcontentloaded' },
      );
      try {
        await page.waitForSelector('[data-testid="outlook-pending"]');
        await page.waitForSelector('.hours button:not(:disabled)');
        await click('save-day');
        await page.click(
          'nav[aria-label="Weather pages"] a[href$="/favorites"]',
        );
        await page.waitForSelector('[data-testid="weather-favorites"]');
        await expect
          .poll(
            () =>
              lab.bridgeRequests.find(item => item.probe === probe)?.aborted,
            { timeout: 5000 },
          )
          .toBe(true);
        lab.releaseBridge(probe);
        await navigation;
        expect(await page.$('[data-testid="outlook-resolved"]')).toBeNull();
        expect(
          await page.$eval(
            '[data-testid="favorite-count"]',
            node => node.textContent,
          ),
        ).toBe('1');
      } finally {
        lab.releaseBridge(probe);
        await navigation;
      }
    });

    it('cancels pending data on navigation and unmount, and does not apply late results to a new visit', async () => {
      const { lab, page, click } = getContext();
      const probe = `weather-cancel-${Date.now()}`;
      await page.goto(`${lab.url}/bridge-ssr/forecast/today?probe=${probe}`, {
        waitUntil: 'networkidle0',
      });
      await page.click('.weather-app-service summary');
      await click('outlook-slow');
      await page.waitForSelector('[data-testid="outlook-pending"]');
      await expect
        .poll(() => lab.bridgeRequests.filter(item => item.probe === probe))
        .toHaveLength(2);
      await page.click('nav[aria-label="Weather pages"] a[href$="/favorites"]');
      await page.waitForSelector('[data-testid="weather-favorites"]');
      await expect
        .poll(
          () =>
            lab.bridgeRequests.filter(item => item.probe === probe).at(-1)
              ?.aborted,
        )
        .toBe(true);
      expect(await page.$('[data-testid="outlook-resolved"]')).toBeNull();

      await page.click('nav[aria-label="Weather pages"] a[href$="/overview"]');
      await page.waitForSelector('[data-testid="weather-overview"]');
      await click('weather-save');
      await click('forecast-today');
      await page.waitForSelector('[data-testid="outlook-resolved"]');
      await page.click('.weather-app-service summary');
      const start = lab.bridgeRequests.length;
      await click('outlook-slow');
      await page.waitForSelector('[data-testid="outlook-pending"]');
      await expect.poll(() => lab.bridgeRequests.length).toBe(start + 1);
      await page.click('.weather-host-controls summary');
      await click('application-toggle');
      expect(await page.$('[data-testid="weather-application"]')).toBeNull();
      await expect.poll(() => lab.bridgeRequests[start]?.aborted).toBe(true);
      await click('application-toggle');
      await page.waitForSelector('[data-testid="outlook-resolved"]');
      expect(lab.bridgeRequests[start]).toMatchObject({
        aborted: true,
        completed: false,
      });
      expect(lab.bridgeRequests[start + 1]).toMatchObject({
        aborted: false,
        completed: true,
      });
      expect(
        await page.$eval(
          '[data-testid="favorite-count"]',
          node => node.textContent,
        ),
      ).toBe('0');
    });
  },
  { publicRoutesOnly: true },
);
