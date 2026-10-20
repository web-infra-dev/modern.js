import puppeteer, { type Browser, type Page } from 'puppeteer';
import { startLab } from '../scripts/lab.mjs';
rstest.setConfig({ testTimeout: 60000, hookTimeout: 600000, retry: 0 });
const selector = (id: string) => `[data-testid="${id}"]`;
const modes = process.env.MF_LAB_MODE
  ? [process.env.MF_LAB_MODE as 'dev' | 'production']
  : (['dev', 'production'] as const);
for (const mode of modes) {
  describe(`Federation lab (${mode})`, () => {
    let lab: Awaited<ReturnType<typeof startLab>>;
    let browser: Browser;
    let page: Page;
    const browserErrors: string[] = [];
    let expectsRecovery = false;
    beforeAll(async () => {
      lab = await startLab(mode);
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
    });
    afterAll(async () => {
      await browser?.close();
      await lab?.stop();
    });
    beforeEach(async () => {
      page = await browser.newPage();
      browserErrors.length = 0;
      expectsRecovery = false;
      page.on('pageerror', error => browserErrors.push(String(error)));
    });
    afterEach(async () => {
      await page?.close();
      if (expectsRecovery) {
        // The existing adapter renders the error fallback on the server. React
        // reports recoverable hydration errors when the two client retries succeed.
        expect(browserErrors).toHaveLength(2);
        for (const error of browserErrors)
          expect(error).toMatch(/Hydration failed|Minified React error #418/);
      } else expect(browserErrors).toEqual([]);
    });
    async function visit(route: string, id: string) {
      await page.goto(`${lab.url}/${route}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector(selector(id));
    }
    async function text(id: string) {
      return page.$eval(selector(id), element => element.textContent);
    }
    async function click(id: string) {
      await page.click(selector(id));
    }
    async function counter(id: string) {
      await click(`${id}-counter`);
      await page.waitForFunction(
        sel =>
          document.querySelector(sel)?.textContent === 'Signals received: 1',
        {},
        selector(`${id}-counter`),
      );
    }
    async function relayTools() {
      for (const [id, label] of [
        ['relay-ping', 'Relay pings'],
        ['relay-pulse', 'Local pulses'],
      ]) {
        await page.waitForSelector(selector(id));
        await click(id);
        expect(await text(id)).toBe(`${label}: 1`);
      }
    }
    it('renders a static remote in HTML, hydrates it and loads its styles', async () => {
      const html = await (await fetch(`${lab.url}/static`)).text();
      expect(html).toContain('A signal from another origin.');
      await visit('static', 'signal');
      await counter('signal');
      await page.waitForFunction(
        () =>
          (
            document.querySelector(
              '[data-testid="signal-image"]',
            ) as HTMLImageElement
          )?.naturalWidth > 0,
      );
      expect(
        await page.$eval(
          selector('signal-image'),
          image => new URL((image as HTMLImageElement).src).port,
        ),
      ).toBe(String(lab.ports.provider));
      expect(
        await page.$eval(
          selector('signal'),
          element => getComputedStyle(element).backgroundColor,
        ),
      ).toBe('rgb(215, 242, 237)');
    });
    it('renders a dynamically registered Rslib remote in HTML and hydrates it', async () => {
      const html = await (await fetch(`${lab.url}/dynamic`)).text();
      expect(html).toContain('A different build. The same connection.');
      await visit('dynamic', 'library-signal');
      await counter('library-signal');
      expect(
        await page.$eval(
          selector('library-signal'),
          element => getComputedStyle(element).backgroundColor,
        ),
      ).toBe('rgb(233, 229, 250)');
    });
    it('renders and hydrates a remote through an independent nested build', async () => {
      expect(await (await fetch(`${lab.url}/nested`)).text()).toContain(
        'A signal from another origin.',
      );
      await visit('nested', 'nested-signal');
      await counter('nested-signal');
      await relayTools();
    });
    it('loads a dynamically nested remote with its styles and interactions', async () => {
      expect(await (await fetch(`${lab.url}/dynamic-nested`)).text()).toContain(
        'A different build. The same connection.',
      );
      await visit('dynamic-nested', 'dynamic-nested-signal');
      await counter('dynamic-nested-signal');
      await relayTools();
      expect(
        await page.$eval(
          selector('dynamic-nested-signal'),
          element => getComputedStyle(element).backgroundColor,
        ),
      ).toBe('rgb(233, 229, 250)');
    });
    it('keeps remote components interactive across client navigation and history', async () => {
      await visit('static', 'signal');
      await page.evaluate(() => {
        (window as any).navigationSentinel = 'preserved';
      });
      await page.click('a[href="/nested"]');
      await page.waitForSelector(selector('nested-signal'));
      await page.goBack();
      await page.waitForSelector(selector('signal'));
      await counter('signal');
      await page.goForward();
      await page.waitForSelector(selector('nested-signal'));
      expect(
        await page.evaluate(() => (window as any).navigationSentinel),
      ).toBe('preserved');
    });
    it('serializes server-fetched remote data into the first HTML response', async () => {
      const html = await (await fetch(`${lab.url}/data`)).text();
      expect(html).toContain('modern-server');
      await visit('data', 'forecast');
      expect(await text('data-source')).toBe('modern-server');
      await click('forecast-counter');
      expect(await text('forecast-counter')).toBe('Readings saved: 1');
    });
    it('renders a CSR-only component and fetches data through the host server', async () => {
      const html = await (await fetch(`${lab.url}/csr`)).text();
      expect(html).not.toContain('data-testid="forecast"');
      const requests: string[] = [];
      page.on('request', request => {
        if (request.url().includes('x-mf-data-fetch'))
          requests.push(request.url());
      });
      await visit('csr', 'forecast');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="data-source"]')?.textContent ===
          'rslib-server',
      );
      await click('forecast-counter');
      expect(await text('forecast-counter')).toBe('Readings saved: 1');
      expect(requests.length).toBeGreaterThan(0);
      expect(new URL(requests[0]).origin).toBe(lab.url);
      expect(new URL(requests[0]).searchParams.get('lab')).toBe('"federation"');
    });
    it('recovers server failures using the client loader and the host retry', async () => {
      expectsRecovery = true;
      await visit('recovery', 'client-recovery');
      await page.waitForFunction(
        () =>
          document.querySelector(
            '[data-testid="client-recovery"] [data-testid="data-source"]',
          )?.textContent === 'client-recovery' &&
          document.querySelector(
            '[data-testid="server-recovery"] [data-testid="data-source"]',
          )?.textContent === 'server-recovery',
      );
    });
    it('avoids refetching on parent rerenders and fetches again on remount', async () => {
      let noDataRequests = 0;
      page.on('request', request => {
        if (decodeURIComponent(request.url()).includes('NoData.data'))
          noDataRequests += 1;
      });
      await visit('lifecycle', 'request-count');
      await page.waitForFunction(() =>
        /\d/.test(
          document.querySelector('[data-testid="request-count"]')
            ?.textContent || '',
        ),
      );
      const count = Number(await text('request-count'));
      await click('rerender');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="parent-renders"]')
            ?.textContent === '1',
      );
      expect(Number(await text('request-count'))).toBe(count);
      await click('remount');
      await page.waitForFunction(
        initial =>
          Number(
            document.querySelector('[data-testid="request-count"]')
              ?.textContent,
          ) > initial,
        {},
        count,
      );
      expect(await page.evaluate(() => (window as any).noDataLoads)).toBe(1);
      expect(noDataRequests).toBe(0);
    });
    it('replaces static and dynamic remotes with independently built version two', async () => {
      await visit('replace', 'provider-forecast');
      await page.waitForSelector(selector('dynamic-forecast'));
      async function forecast(
        name: string,
        version: string,
        temperature: string,
        condition: string,
      ) {
        const id = `${name}-forecast`;
        await page.waitForFunction(
          (sel, expected) =>
            document.querySelector(sel)?.getAttribute('data-version') ===
            expected,
          {},
          selector(id),
          version,
        );
        expect(await text(`${id}-temperature`)).toBe(temperature);
        expect(await text(`${id}-condition`)).toBe(condition);
        await click(`${id}-counter`);
        expect(await text(`${id}-counter`)).toBe('Readings saved: 1');
      }
      await forecast('provider', 'v1', '24', 'Clear skies ahead.');
      await forecast('dynamic', 'v1', '24', 'Clear skies ahead.');
      await click('replace-provider');
      await forecast('provider', 'v2', '16', 'Rain is rolling in.');
      // Replacing the Modern remote must leave the other station on version one.
      expect(await text('dynamic-forecast-temperature')).toBe('24');
      await click('replace-dynamic');
      await forecast('dynamic', 'v2', '16', 'Rain is rolling in.');
    });
    it('compares real CSR/SSR documents and isolates interactive weather frames', async () => {
      const ssr = await (
        await fetch(`${lab.url}/weather?render=ssr&data=local`)
      ).text();
      const csr = await (
        await fetch(`${lab.url}/weather?render=csr&csr=1&data=local`)
      ).text();
      for (const id of [
        'weather-current',
        'weather-hourly',
        'weather-days',
        'weather-wind',
      ])
        expect(ssr).toContain(`data-testid="${id}"`);
      expect(csr).not.toContain('data-testid="weather-current"');
      const requests: string[] = [];
      const delays: string[] = [];
      page.on('request', request => requests.push(request.url()));
      page.on('response', response => {
        if (response.headers()['x-lab-script-delay'])
          delays.push(response.headers()['x-lab-script-delay']);
      });
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${lab.url}/compare`, { waitUntil: 'networkidle0' });
      const frames = page
        .frames()
        .filter(frame => frame.url().includes('/weather?'));
      expect(frames).toHaveLength(2);
      for (const frame of frames) {
        await frame.waitForSelector(
          '[data-testid="weather-save"]:not(:disabled)',
        );
        await frame.click('[data-testid="weather-save"]');
        expect(
          await frame.$eval(
            '[data-testid="weather-save"]',
            element => element.textContent,
          ),
        ).toContain('已收藏');
        await frame.$eval('input[aria-label="调整风向"]', element => {
          const input = element as HTMLInputElement;
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )!.set!;
          setter.call(input, '180');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await frame.waitForFunction(
          () =>
            document.querySelector('[data-testid="wind-angle"]')
              ?.textContent === '180°',
        );
        expect(
          await frame.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
        ).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.comparison-panel>header')].every(
          header => header.textContent?.includes('交互已验证'),
        ),
      );
      expect(
        requests.filter(
          url =>
            /^https?:/.test(url) &&
            !['localhost', '127.0.0.1'].includes(new URL(url).hostname),
        ),
      ).toEqual([]);
      for (const viewport of [
        { width: 1440, height: 900 },
        { width: 1280, height: 800 },
      ]) {
        await page.setViewport(viewport);
        for (const frame of frames)
          await frame.waitForFunction(() =>
            [...document.querySelectorAll('.weather-card')]
              .filter(card => getComputedStyle(card).display !== 'none')
              .every(card => card.scrollHeight <= card.clientHeight + 1),
          );
      }
      expect(delays).toContain('1500');
    });
    it('compares four data paths using a local API and the MF data loader', async () => {
      const normal = await (
        await fetch(`${lab.url}/weather?render=ssr&data=client&compact=1`)
      ).text();
      const prefetched = await (
        await fetch(`${lab.url}/weather?render=ssr&data=mf&compact=1`)
      ).text();
      expect(normal).toContain('data-source="pending"');
      expect(prefetched).toContain('data-source="本地天气 API"');
      const dataRequests: string[] = [];
      page.on('request', request => {
        if (
          request.url().includes('WeatherData_data') ||
          request.url().includes('WeatherData.data') ||
          request.url().includes('x-mf-data-fetch')
        )
          dataRequests.push(request.url());
      });
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${lab.url}/compare-data`, { waitUntil: 'networkidle0' });
      const frames = page
        .frames()
        .filter(frame => frame.url().includes('/weather?'));
      expect(frames).toHaveLength(4);
      for (const frame of frames) {
        await frame.waitForSelector('[data-source="本地天气 API"]');
        await frame.click('[data-testid="weather-save"]');
        expect(
          await frame.$eval(
            '[data-testid="weather-save"]',
            element => element.textContent,
          ),
        ).toContain('已收藏');
        expect(await frame.$('[data-testid="weather-days"]')).toBeNull();
        expect(
          await frame.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
        ).toBe(true);
      }
      expect(dataRequests.length).toBeGreaterThan(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
    });
    it('inspects runtime remote identities and nested chains without remounting weather', async () => {
      const colors = new Map<string, string>();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${lab.url}/compare`, { waitUntil: 'networkidle0' });
      const frames = page
        .frames()
        .filter(frame => frame.url().includes('/weather?'));
      for (const frame of frames) {
        expect(await frame.$('[data-testid="mf-inspect-outline"]')).toBeNull();
        await frame.click('[data-testid="weather-save"]');
        await frame.evaluate(() => {
          (window as any).inspectSentinel = 'preserved';
        });
      }
      await page.click('.inspect-control input');
      for (const frame of frames) {
        await frame.waitForFunction(
          () =>
            document.querySelectorAll('[data-testid="mf-inspect-outline"]')
              .length === 4,
        );
        const palette = await frame.$$eval(
          '[data-testid="mf-inspect-outline"]',
          elements =>
            elements.map(element => ({
              name: element.getAttribute('data-mf-name')!,
              color: getComputedStyle(element).borderTopColor,
            })),
        );
        for (const { name, color } of palette) {
          if (colors.has(name)) expect(color).toBe(colors.get(name));
          else colors.set(name, color);
        }
        const hourly = await frame.$eval(
          '[data-testid="mf-inspect-outline"][data-mf-expose="./WeatherHourly"] .mf-inspect-label',
          element => ({
            name: element.textContent,
            url: (element as HTMLAnchorElement).href,
            title: element.getAttribute('title'),
          }),
        );
        expect(hourly.name).toContain('lab_library');
        expect(hourly.url).toBe(
          `http://localhost:${lab.ports.library}/mf-manifest.json`,
        );
        expect(hourly.title).toContain('Entry: http://localhost:');
        expect(
          await frame.$eval(
            '[data-testid="mf-inspect-outline"][data-mf-expose="./WeatherDays"]',
            element => element.textContent,
          ),
        ).toContain('lab_nested → lab_provider');
        expect(
          await frame.$eval(
            '[data-testid="mf-inspect-outline"][data-mf-expose="./WeatherWind"]',
            element => element.textContent,
          ),
        ).toContain('lab_nested → lab_library');
        expect(
          await frame.$eval(
            '[data-testid="weather-save"]',
            element => element.textContent,
          ),
        ).toContain('已收藏');
        expect(
          await frame.evaluate(() => (window as any).inspectSentinel),
        ).toBe('preserved');
        const position = await frame.$eval(
          '[data-testid="weather-hourly"]',
          element => {
            const rect = element.getBoundingClientRect();
            return {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
          },
        );
        const outline = await frame.$eval(
          '[data-testid="mf-inspect-outline"][data-mf-expose="./WeatherHourly"]',
          element => {
            const rect = element.getBoundingClientRect();
            return {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
          },
        );
        for (const key of ['left', 'top', 'width', 'height'] as const)
          expect(Math.abs(position[key] - outline[key])).toBeLessThan(2);
      }
      await page.click('.inspect-control input');
      for (const frame of frames)
        await frame.waitForFunction(
          () => !document.querySelector('[data-testid="mf-inspect-outline"]'),
        );
      await page.click('.inspect-control input');
      await page.click('.comparison-controls button');
      await page.waitForNetworkIdle();
      for (const frame of page
        .frames()
        .filter(frame => frame.url().includes('/weather?'))) {
        await frame.waitForSelector('[data-testid="mf-inspect-outline"]');
        const palette = await frame.$$eval(
          '[data-testid="mf-inspect-outline"]',
          elements =>
            elements.map(element => ({
              name: element.getAttribute('data-mf-name')!,
              color: getComputedStyle(element).borderTopColor,
            })),
        );
        for (const { name, color } of palette)
          expect(color).toBe(colors.get(name));
      }
    });
    it('inspects data-fetch components without wrapping loaders or repeating data requests', async () => {
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${lab.url}/compare-data`, { waitUntil: 'networkidle0' });
      const frames = page
        .frames()
        .filter(frame => frame.url().includes('/weather?'));
      const initial = [];
      for (const frame of frames) {
        await frame.waitForSelector('[data-source="本地天气 API"]');
        await frame.waitForSelector(
          '[data-testid="weather-save"]:not(:disabled)',
        );
        initial.push(
          await frame.$eval('.weather-source', element => element.textContent),
        );
        await frame.click('[data-testid="weather-save"]');
        expect(
          await frame.$eval(
            '[data-testid="weather-save"]',
            element => element.textContent,
          ),
        ).toContain('已收藏');
      }
      let requests = 0;
      page.on('request', request => {
        if (
          request.url().includes('/weather') ||
          request.url().includes('x-mf-data-fetch')
        )
          requests++;
      });
      await page.click('.inspect-control input');
      for (const [index, frame] of frames.entries()) {
        await frame.waitForFunction(
          () =>
            document.querySelectorAll('[data-testid="mf-inspect-outline"]')
              .length === 2,
        );
        expect(
          await frame.$eval('.weather-source', element => element.textContent),
        ).toBe(initial[index]);
        expect(
          await frame.$eval(
            '[data-testid="weather-save"]',
            element => element.textContent,
          ),
        ).toContain('已收藏');
        expect(
          await frame.$(
            '[data-testid="mf-inspect-outline"][data-mf-expose$=".data"]',
          ),
        ).toBeNull();
      }
      expect(requests).toBe(0);
    });
    it('isolates advanced replacement state when switching weather experiments', async () => {
      await page.goto(`${lab.url}/advanced`, { waitUntil: 'networkidle0' });
      let frame = page
        .frames()
        .find(frame => frame.url().includes('/replace?'))!;
      await frame.waitForSelector(
        '[data-testid="provider-forecast"][data-version="v1"]',
      );
      await frame.click('[data-testid="replace-provider"]');
      await frame.waitForSelector(
        '[data-testid="provider-forecast"][data-version="v2"]',
      );
      await page.select('select[aria-label="进阶场景"]', 'lifecycle');
      await page.waitForFunction(() =>
        document
          .querySelector('iframe')
          ?.contentDocument?.querySelector('[data-testid="request-count"]'),
      );
      frame = page.frames().find(frame => frame.url().includes('/lifecycle?'))!;
      await frame.waitForSelector('[data-testid="request-count"]');
      expect(
        await frame.$eval(
          '.lifecycle-temperature',
          element => element.textContent,
        ),
      ).toBe('30°');
      await page.select('select[aria-label="进阶场景"]', 'replace');
      await page.waitForFunction(() =>
        document
          .querySelector('iframe')
          ?.contentDocument?.querySelector(
            '[data-testid="provider-forecast"][data-version="v1"]',
          ),
      );
    });
    it('serves custom manifest paths and all referenced server entry files', async () => {
      const manifest = await (
        await fetch(
          `http://localhost:${lab.ports.provider}/static/mf-manifest.json`,
        )
      ).json();
      expect(manifest.metaData.name).toBe('lab_provider');
      const server = manifest.metaData.ssrRemoteEntry;
      expect(server).toBeTruthy();
      const url = new URL(
        `${server.path || ''}${server.name}`,
        manifest.metaData.ssrPublicPath,
      );
      const response = await fetch(url);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('lab_provider');
    });
  });
}
