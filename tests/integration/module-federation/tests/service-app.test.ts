import { describeLab } from './fixture';

const messages = (text: string) =>
  [
    ...text.matchAll(
      /\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[^\n]+?\])\)<\/script>/g,
    ),
  ].map(match => JSON.parse(match[1])[1]);
const htmlMessages = (text: string) =>
  messages(text)
    .filter(frame => frame.type === 'html')
    .map(frame => frame.html as string)
    .join('');

describeLab(
  'Service weather application',
  getContext => {
    it('keeps the CSR document empty and includes real producer HTML in the SSR response', async () => {
      const { lab, mode } = getContext();
      const ssr = await (
        await fetch(
          `http://localhost:${lab.ports.serviceSSR}/service/forecast/wed?probe=raw-service`,
        )
      ).text();
      const csr = await (
        await fetch(
          `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed?probe=raw-service`,
        )
      ).text();
      expect(htmlMessages(ssr)).toContain('data-testid="weather-detail"');
      expect(messages(ssr).filter(frame => frame.type === 'error')).toEqual([]);
      expect(messages(ssr).some(frame => frame.type === 'done')).toBe(true);
      expect(htmlMessages(ssr)).toContain('data-testid="outlook-resolved"');
      expect(csr).not.toContain('data-testid="weather-detail"');
      expect(csr).not.toContain('"protocol":"modern-application/2"');
      if (mode === 'production') {
        const nodeBundle = await (
          await fetch(
            `http://localhost:${lab.ports.serviceSSR}/bundles/index.js`,
          )
        ).text();
        expect(nodeBundle).toContain('bridge-service');
        expect(nodeBundle).not.toContain('local-service-test-key');
        expect(nodeBundle).not.toContain(
          `http://localhost:${lab.ports.provider}/services/weather`,
        );
      }
    });

    it('hydrates a complete-document late mount once while HTTP continues, preserving DOM and state', async () => {
      const { lab, page, consoleErrors } = getContext();
      await page.evaluateOnNewDocument(() => {
        const observed = window as typeof window & {
          serviceButton?: Element;
          serviceRange?: Element;
        };
        new MutationObserver(() => {
          observed.serviceButton ||=
            document.querySelector('[data-testid="save-day"]') || undefined;
          observed.serviceRange ||=
            document.querySelector(
              'input[aria-label="Adjust wind direction"]',
            ) || undefined;
        }).observe(document, { childList: true, subtree: true });
      });
      await page.goto(
        `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed?late=1&delay=5000&probe=late-service`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="service-toggle"]');
      expect(await page.evaluate(() => document.readyState)).toBe('complete');
      await page.click('[data-testid="service-toggle"]');
      await page.waitForSelector('[data-testid="save-day"]', { visible: true });
      await page.waitForFunction(
        () => {
          const button = document.querySelector<HTMLButtonElement>(
            '[data-testid="save-day"]',
          );
          if (button?.getAttribute('aria-pressed') === 'true') return true;
          button?.click();
          return false;
        },
        { polling: 100 },
      );
      expect(await page.$('[data-testid="outlook-pending"]')).not.toBeNull();
      await page.waitForSelector(
        'input[aria-label="Adjust wind direction"]:not(:disabled)',
      );
      await page.focus('input[aria-label="Adjust wind direction"]');
      await page.keyboard.press('Home');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="wind-angle"]')?.textContent ===
          '0°',
      );
      await page.click('[data-testid="service-props"]');
      await page.waitForFunction(
        () =>
          document.querySelector('.weather-app-header h1')?.textContent ===
          'West Lake',
      );
      await page.waitForSelector('[data-testid="outlook-resolved"]');
      await page.waitForFunction(() => {
        const roots = Array.from(
          document.querySelectorAll('[data-mf-bridge-root]'),
        );
        const runtime = (
          window as typeof window & {
            __MF_BRIDGE_SSR__?: {
              get(id: string): { complete: boolean } | undefined;
            };
          }
        ).__MF_BRIDGE_SSR__;
        return (
          roots.length > 0 &&
          roots.every(root => runtime?.get(root.id)?.complete)
        );
      });

      expect(
        await page.evaluate(
          () =>
            (window as typeof window & { serviceButton?: Element })
              .serviceButton ===
            document.querySelector('[data-testid="save-day"]'),
        ),
      ).toBe(true);
      expect(
        await page.$eval('[data-testid="save-day"]', element =>
          element.getAttribute('aria-pressed'),
        ),
      ).toBe('true');
      expect(
        await page.$eval(
          'input[aria-label="Adjust wind direction"]',
          input => (input as HTMLInputElement).value,
        ),
      ).toBe('0');
      expect(
        await page.evaluate(
          () =>
            (window as typeof window & { serviceRange?: Element })
              .serviceRange ===
            document.querySelector('input[aria-label="Adjust wind direction"]'),
        ),
      ).toBe(true);
      expect(
        await page.$eval(
          '[data-testid="wind-angle"]',
          element => element.textContent,
        ),
      ).toBe('0°');
      expect(consoleErrors).toEqual([]);
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
      expect(
        lab.bridgeRequests.filter(record => record.probe === 'late-service'),
      ).toHaveLength(1);
    });

    it('keeps independent instances and state through connected navigation', async () => {
      const { lab, page } = getContext();
      await page.goto(
        `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed?multi=1&probe=multi-service`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForFunction(
        () =>
          document.querySelectorAll('[data-testid="save-day"]').length === 2,
      );
      await page.click('[data-testid="save-day"]');
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="save-day"]')
            ?.getAttribute('aria-pressed') === 'true',
      );
      expect(
        await page.$$eval('[data-testid="save-day"]', buttons =>
          buttons.map(button => button.getAttribute('aria-pressed')),
        ),
      ).toEqual(['true', 'false']);
      await page.click('.weather-app-nav a[href$="favorites"]');
      await page.waitForFunction(
        () =>
          document.querySelectorAll('[data-testid="weather-favorites"]')
            .length === 2,
      );
      expect(new URL(page.url()).pathname).toBe('/service/favorites');
      expect(await page.$$('[data-testid="favorites-empty"]')).toHaveLength(1);
      expect(
        await page.$eval(
          '[data-testid="favorite-count"]',
          element => element.textContent,
        ),
      ).toBe('1');
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
    });

    it('keeps an explicit memoryRoute independent of the Host URL', async () => {
      const { lab, page } = getContext();
      const url = `http://localhost:${lab.ports.serviceCSR}/service/not-a-route?declarative=1&memory=1&probe=memory-service`;
      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="save-day"]', { visible: true });
      await page.click('[data-testid="save-day"]');
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="save-day"]')
            ?.getAttribute('aria-pressed') === 'true',
      );
      await page.click('.weather-app-nav a[href$="favorites"]');
      await page.waitForSelector('[data-testid="weather-favorites"]');
      expect(page.url()).toBe(url);
      expect(
        await page.$eval(
          '[data-testid="favorite-count"]',
          element => element.textContent,
        ),
      ).toBe('1');
    });

    it.each(['early', 'late'])(
      'recovers a real Service HTTP %s failure once through a CSR document',
      async fault => {
        const { lab, page } = getContext();
        let requests = 0;
        page.on('request', request => {
          if (request.url().includes('/_modern/mf/service/')) requests++;
        });
        await page
          .goto(
            `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed?delay=5000&serviceFault=${fault}&probe=fault-${fault}`,
            { waitUntil: 'domcontentloaded' },
          )
          .catch(error => {
            if (!String(error).includes('net::ERR_ABORTED')) throw error;
          });
        if (fault === 'late') {
          await page.waitForFunction(
            () => {
              const button = document.querySelector<HTMLButtonElement>(
                '[data-testid="save-day"]',
              );
              if (button?.getAttribute('aria-pressed') === 'true') return true;
              button?.click();
              return false;
            },
            { polling: 100 },
          );
          expect(
            await page.$('[data-testid="outlook-pending"]'),
          ).not.toBeNull();
          expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
          lab.releaseBridge('service-transport-fault');
        }
        await page.waitForFunction(
          () => new URL(location.href).searchParams.get('csr') === '1',
        );
        await page.waitForSelector('[data-testid="save-day"]', {
          visible: true,
        });
        await page.waitForFunction(
          () => {
            const button = document.querySelector<HTMLButtonElement>(
              '[data-testid="save-day"]',
            );
            if (button?.getAttribute('aria-pressed') === 'true') return true;
            button?.click();
            return false;
          },
          { polling: 100 },
        );
        expect(requests).toBe(1);
        expect(await page.$('#mf-bridge-fatal-error')).toBeNull();
      },
    );

    it.each(['', '&static=1', '&declarative=1', '&declarative=1&static=1'])(
      'retains both function inputs and unified APIs: %s',
      async variant => {
        const { lab, page } = getContext();
        for (const name of ['serviceSSR', 'serviceCSR']) {
          await page.goto(
            `http://localhost:${lab.ports[name]}/service/forecast/wed?probe=inputs-${name}${variant}`,
            { waitUntil: 'networkidle0' },
          );
          await page.waitForSelector('[data-testid="save-day"]', {
            visible: true,
          });
          await page.click('[data-testid="save-day"]');
          await page.waitForFunction(
            () =>
              document
                .querySelector('[data-testid="save-day"]')
                ?.getAttribute('aria-pressed') === 'true',
          );
          expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
        }
      },
    );

    it.each(['serviceSSR', 'serviceCSR'])(
      'hits the result cache on a matching real document without repeating business requests: %s',
      async host => {
        const { lab, page } = getContext();
        const url = `http://localhost:${lab.ports[host]}/service/forecast/wed?probe=cache-${host}`;
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.waitForSelector('[data-testid="outlook-resolved"]');
        const first = await (
          await fetch(`http://localhost:${lab.ports.api}/service-stats`)
        ).json();
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.waitForSelector('[data-testid="outlook-resolved"]');
        await page.click('[data-testid="save-day"]');
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-testid="save-day"]')
              ?.getAttribute('aria-pressed') === 'true',
        );
        const second = await (
          await fetch(`http://localhost:${lab.ports.api}/service-stats`)
        ).json();
        expect(second).toEqual(first);
        expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
      },
    );

    it('cancels an unfinished mount and reconnects with independent state', async () => {
      const { lab, page } = getContext();
      await page.goto(
        `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed?late=1&delay=5000&probe=cancel-service`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="service-toggle"]');
      await page.click('[data-testid="service-toggle"]');
      await page.waitForSelector('[data-testid="save-day"]', { visible: true });
      await page.click('[data-testid="service-toggle"]');
      await rstest.waitFor(() =>
        expect(
          lab.bridgeRequests.some(
            record => record.probe === 'cancel-service' && record.aborted,
          ),
        ).toBe(true),
      );
      await page.click('[data-testid="service-toggle"]');
      await page.waitForSelector('[data-testid="outlook-resolved"]');
      expect(
        await page.$eval('[data-testid="save-day"]', element =>
          element.getAttribute('aria-pressed'),
        ),
      ).toBe('false');
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
    });

    it('preserves noSSR and explicit CSR recovery without entering a Service request loop', async () => {
      const { lab, page } = getContext();
      for (const query of ['nossr=1', 'csr=1']) {
        let requests = 0;
        const observe = (request: { url(): string }) => {
          if (request.url().includes('/_modern/mf/service/')) requests++;
        };
        page.on('request', observe);
        await page.goto(
          `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed?${query}`,
          { waitUntil: 'networkidle0' },
        );
        await page.waitForSelector('[data-testid="save-day"]', {
          visible: true,
        });
        await page.click('[data-testid="save-day"]');
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-testid="save-day"]')
              ?.getAttribute('aria-pressed') === 'true',
        );
        page.off('request', observe);
        expect(requests).toBe(0);
      }
    });
  },
  { service: true, publicRoutesOnly: true },
);

describeLab(
  'Service Hash routing',
  getContext => {
    it('hydrates the logical Hash location and keeps navigation in the same instance', async () => {
      const { lab, page } = getContext();
      await page.goto(
        `http://localhost:${lab.ports.serviceCSR}/#/service/forecast/wed?probe=hash-service`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="save-day"]', { visible: true });
      await page.click('[data-testid="save-day"]');
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="save-day"]')
            ?.getAttribute('aria-pressed') === 'true',
      );
      await page.click('.weather-app-nav a[href$="favorites"]');
      await page.waitForSelector('[data-testid="weather-favorites"]');
      expect(new URL(page.url()).hash).toBe('#/service/favorites');
      expect(
        await page.$eval(
          '[data-testid="favorite-count"]',
          element => element.textContent,
        ),
      ).toBe('1');
      expect(
        lab.bridgeRequests.filter(record => record.probe === 'hash-service'),
      ).toHaveLength(1);
      const stats = await (
        await fetch(`http://localhost:${lab.ports.api}/service-stats`)
      ).json();
      expect(stats.weather).toBe(1);
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
    });
  },
  { service: true, publicRoutesOnly: true, hash: true },
);
