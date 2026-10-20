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
      await visit('replace', 'signal');
      await page.waitForSelector(selector('library-signal'));
      expect(await text('signal')).toContain('v1');
      expect(await text('library-signal')).toContain('v1');
      await click('replace-provider');
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="signal"]')
          ?.textContent?.includes('v2'),
      );
      await counter('signal');
      await click('replace-dynamic');
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="library-signal"]')
          ?.textContent?.includes('v2'),
      );
      await counter('library-signal');
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
