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

    it('cancels pending data on navigation and unmount, then starts a fresh request on remount', async () => {
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

    it('delivers old deferred Bridge frames after remount without changing the new instance', async () => {
      const { lab, page, click } = getContext();
      const probe = `weather-late-${crypto.randomUUID()}`;
      const markerA = `${probe}-A`;
      const markerB = `${probe}-B`;
      const route = `/bridge-ssr/forecast/today?probe=${probe}&hold=1`;
      const gate = lab.gateDocument(route);
      const clearResults = lab.queueBridgeResults(probe, [markerA, markerB]);
      const navigation = page.goto(`${lab.url}${route}`, {
        waitUntil: 'domcontentloaded',
      });
      // Always attach a rejection handler, including failures before cleanup.
      void navigation.catch(() => {});
      try {
        await page.waitForSelector('[data-testid="outlook-pending"]');
        await page.waitForSelector('.hours button:not(:disabled)');
        expect(lab.bridgeRequests.filter(item => item.probe === probe)).toEqual(
          [{ probe, marker: markerA, completed: false, aborted: false }],
        );
        const instanceA = await page.evaluate(() => {
          const runtime = (window as any).__MF_BRIDGE_SSR__;
          const node = document.querySelector(
            '[data-testid="weather-application"]',
          )!;
          (window as any).__weatherVisitA = node;
          (window as any).__weatherLateFrames = [];
          const original = runtime.accept;
          // Observation only: the real receiver gets every original argument.
          // Record after it returns, so arrival is stronger than a network log.
          runtime.accept = function (
            id: string,
            frame: { type: string; value?: unknown },
          ) {
            const result = original.call(this, id, frame);
            (window as any).__weatherLateFrames.push({ id, frame });
            return result;
          };
          (window as any).__restoreWeatherReceiver = () => {
            runtime.accept = original;
          };
          return node.closest('[data-mf-bridge-ssr]')!.id;
        });
        expect(instanceA).not.toBe('');

        // Finish A at the producer, but leave its genuine HTML/update/done
        // frames in transit. A's API job can no longer be cancelled on unmount.
        gate.hold();
        lab.releaseBridge(probe);
        await expect.poll(() => gate.ended).toBe(true);
        const tail = gate.buffered;
        const frames = [
          ...tail.matchAll(
            /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
          ),
        ].map(
          match =>
            JSON.parse(match[1]) as [string, { type: string; value?: unknown }],
        );
        const updateA = frames.find(
          ([id, frame]) =>
            id === instanceA &&
            frame.type === 'update' &&
            JSON.stringify(frame.value).includes(markerA),
        );
        expect(updateA).toBeDefined();
        expect(
          frames.some(
            ([id, frame]) => id === instanceA && frame.type === 'done',
          ),
        ).toBe(true);
        expect(lab.bridgeRequests.filter(item => item.probe === probe)).toEqual(
          [{ probe, marker: markerA, completed: true, aborted: false }],
        );
        expect(await page.$('[data-testid="outlook-resolved"]')).toBeNull();
        expect(
          await page.evaluate(() => (window as any).__weatherLateFrames),
        ).toEqual([]);

        await page.click('.weather-host-controls summary');
        await click('application-toggle');
        expect(await page.$('[data-testid="weather-application"]')).toBeNull();
        await click('application-toggle');
        await page.waitForFunction(
          marker =>
            document
              .querySelector('[data-testid="outlook-resolved"]')
              ?.textContent?.includes(marker),
          {},
          markerB,
        );
        await page.waitForSelector('.hours button:not(:disabled)');
        await click('save-day');
        await page.click('.hours button:nth-child(3)');
        await page.evaluate(() => {
          (window as any).__weatherVisitB = [
            '[data-testid="weather-application"]',
            '[data-testid="weather-detail"]',
            '[data-testid="outlook-resolved"]',
            '.hours button:nth-child(3)',
          ].map(selector => ({
            selector,
            node: document.querySelector(selector),
          }));
        });
        expect(
          await page.evaluate(
            () => (window as any).__weatherVisitA.isConnected,
          ),
        ).toBe(false);
        expect(lab.bridgeRequests.filter(item => item.probe === probe)).toEqual(
          [
            { probe, marker: markerA, completed: true, aborted: false },
            { probe, marker: markerB, completed: true, aborted: false },
          ],
        );
        expect(
          await page.evaluate(() => (window as any).__weatherLateFrames),
        ).toEqual([]);

        // B is ready and interactive. Send A's unmodified response bytes now.
        gate.release();
        const response = await navigation;
        expect(response?.status()).toBe(200);
        expect(response?.request().failure()).toBeNull();
        await page.waitForFunction(
          ({ id, marker }) => {
            const frames = (window as any).__weatherLateFrames;
            return (
              frames.some(
                (event: any) =>
                  event.id === id &&
                  event.frame.type === 'update' &&
                  JSON.stringify(event.frame.value).includes(marker),
              ) &&
              frames.some(
                (event: any) => event.id === id && event.frame.type === 'done',
              )
            );
          },
          {},
          { id: instanceA, marker: markerA },
        );
        const arrived = await page.evaluate(
          () => (window as any).__weatherLateFrames,
        );
        expect(arrived).toContainEqual({ id: updateA![0], frame: updateA![1] });
        // Let React process any work triggered by those real frames, without a
        // fixed sleep or writing application state from the test.
        await page.evaluate(
          () =>
            new Promise<void>(resolve =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        expect(
          await page.$eval(
            '[data-testid="outlook-resolved"]',
            node => node.textContent,
          ),
        ).toContain(markerB);
        expect(
          await page.$eval(
            '[data-testid="weather-application"]',
            node => node.textContent,
          ),
        ).not.toContain(markerA);
        expect(
          await page.evaluate(() =>
            (window as any).__weatherVisitB.every(
              ({ selector, node }: { selector: string; node: Element }) =>
                node.isConnected && node === document.querySelector(selector),
            ),
          ),
        ).toBe(true);
        expect(
          await page.$eval(
            '[data-testid="favorite-count"]',
            node => node.textContent,
          ),
        ).toBe('1');
        expect(
          await page.$eval('[data-testid="save-day"]', node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
        expect(
          await page.$eval('.hours button:nth-child(3)', node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
        await page.click('.hours button:nth-child(4)');
        expect(
          await page.$eval('.hours button:nth-child(4)', node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
        expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
      } finally {
        lab.releaseBridge(probe);
        gate.release();
        clearResults();
        try {
          await navigation;
        } finally {
          gate.dispose();
          if (!page.isClosed())
            await page.evaluate(() =>
              (window as any).__restoreWeatherReceiver?.(),
            );
        }
      }
    });
  },
  { publicRoutesOnly: true },
);
