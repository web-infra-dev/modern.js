import type { HTTPRequest } from 'puppeteer';
import { describeLab } from './fixture';

const panel = (name: string) => `[data-testid="memory-panel-${name}"]`;
const inPanel = (name: string, target: string) =>
  `${panel(name)} [data-testid="${target}"]`;
const detailLoaderId = '__applications/memory-demo/detail/(id)/page';

describeLab(
  'Memory route multi-instance and SSR redirect hydration',
  getContext => {
    it('hydrates multi-instance memoryRoute (initialEntries, initialIndex, basename, state) and SSR internal 3xx redirects without mismatch or duplicate loader requests', async () => {
      const { page, lab } = getContext();
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const loaderRequests: {
        pathname: string;
        probe: string;
        origin: string;
      }[] = [];

      await page.setRequestInterception(true);
      page.on('request', async (request: HTTPRequest) => {
        const url = new URL(request.url());
        if (
          request.method() === 'GET' &&
          url.searchParams.get('__loader') === detailLoaderId
        ) {
          loaderRequests.push({
            origin: url.origin,
            pathname: url.pathname,
            probe: url.searchParams.get('probe') || '',
          });
        }
        if (
          url.origin === lab.url &&
          /^\/static\/js\/index(?:\.[\w]+)?\.js$/.test(url.pathname)
        ) {
          await gate;
        }
        if (!request.isInterceptResolutionHandled()) {
          await request.continue();
        }
      });

      const navigation = page.goto(`${lab.url}/memory-route/alpha`, {
        waitUntil: 'domcontentloaded',
      });

      try {
        await page.waitForFunction(() =>
          ['persistent', 'a', 'b'].every(name =>
            document.querySelector(
              `[data-testid="memory-panel-${name}"] [data-testid="memory-demo-root"]`,
            ),
          ),
        );

        expect(
          await page.evaluate(
            () => document.documentElement.dataset.memoryRouteReady,
          ),
        ).toBeUndefined();
        expect(await page.$(inPanel('csr', 'memory-demo-root'))).toBeNull();

        // Verify SSR HTML before client hydration:
        // Panel A starts at initialIndex=1 (/detail/11?tab=specs) with basename=/shop & state
        expect(
          await page.$eval(
            inPanel('a', 'memory-demo-detail-data'),
            node => node.textContent,
          ),
        ).toBe('detail:11:specs:panel-a');
        expect(
          await page.$eval(
            inPanel('a', 'memory-demo-detail-state'),
            node => node.textContent,
          ),
        ).toBe('catalog');
        expect(
          await page.$eval(inPanel('a', 'memory-demo-root'), node => ({
            enabled: node.getAttribute('data-memory-enabled'),
            basename: node.getAttribute('data-memory-basename'),
            index: node.getAttribute('data-memory-index'),
            entries: node.getAttribute('data-memory-entries'),
          })),
        ).toEqual({
          enabled: 'true',
          basename: '/shop',
          index: '1',
          entries: '3',
        });

        // Panel B followed the internal 302 loader redirect on SSR (/redirect -> /detail/42)
        expect(
          await page.$eval(
            inPanel('b', 'memory-demo-detail-data'),
            node => node.textContent,
          ),
        ).toBe('detail:42:landed:panel-b');
        expect(
          await page.$eval(
            inPanel('b', 'memory-demo-location'),
            node => node.textContent,
          ),
        ).toBe('/detail/42?tab=landed&probe=panel-b');
        expect(
          await page.$eval(inPanel('b', 'memory-demo-root'), node => ({
            enabled: node.getAttribute('data-memory-enabled'),
            basename: node.getAttribute('data-memory-basename'),
            index: node.getAttribute('data-memory-index'),
            entries: node.getAttribute('data-memory-entries'),
          })),
        ).toEqual({
          enabled: 'true',
          basename: '/promo',
          index: '1',
          entries: '2',
        });

        // Capture exact SSR DOM nodes to confirm hydration preserves them
        await page.evaluate(() => {
          (window as any).__memoryServerNodes = ['persistent', 'a', 'b'].map(
            name =>
              document.querySelector(
                `[data-testid="memory-panel-${name}"] [data-testid="memory-demo-root"]`,
              ),
          );
        });

        release();
        const response = await navigation;
        const body = await response!.text();
        const frames = [
          ...body.matchAll(
            /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
          ),
        ].map(match => JSON.parse(match[1]));
        expect(
          frames.filter(([, frame]) => frame.type === 'done'),
        ).toHaveLength(3);
        expect(frames.some(([, frame]) => frame.type === 'error')).toBe(false);

        await page.waitForSelector('html[data-memory-route-ready="true"]');
        await page.waitForSelector(inPanel('csr', 'memory-demo-detail-data'));
        await page.waitForNetworkIdle({ idleTime: 200 });

        // Exact SSR DOM nodes must survive hydration without mismatch or remount
        expect(
          await page.evaluate(() =>
            ['persistent', 'a', 'b'].every(
              (name, index) =>
                (window as any).__memoryServerNodes[index] ===
                document.querySelector(
                  `[data-testid="memory-panel-${name}"] [data-testid="memory-demo-root"]`,
                ),
            ),
          ),
        ).toBe(true);

        // Panel A and Panel B remain on their SSR / redirected routes with zero duplicate loader requests
        expect(
          await page.$eval(
            inPanel('a', 'memory-demo-detail-data'),
            node => node.textContent,
          ),
        ).toBe('detail:11:specs:panel-a');
        expect(
          await page.$eval(
            inPanel('b', 'memory-demo-detail-data'),
            node => node.textContent,
          ),
        ).toBe('detail:42:landed:panel-b');
        expect(
          loaderRequests.filter(
            req => req.probe === 'panel-a' || req.probe === 'panel-b',
          ),
        ).toEqual([]);

        // Panel CSR mounts on the client and resolves its basename-stripped producer loader URL
        expect(
          await page.$eval(
            inPanel('csr', 'memory-demo-detail-data'),
            node => node.textContent,
          ),
        ).toBe('detail:77:csr:panel-csr');
        expect(
          await page.$eval(
            inPanel('csr', 'memory-demo-detail-state'),
            node => node.textContent,
          ),
        ).toBe('csr-card');
        const csrLoader = loaderRequests.filter(
          req => req.probe === 'panel-csr',
        );
        expect(csrLoader).toHaveLength(1);
        expect(csrLoader[0].origin).toBe(
          `http://localhost:${lab.ports.provider}`,
        );
        expect(csrLoader[0].pathname).toBe('/memory-demo/detail/77');

        expect(new URL(page.url()).pathname).toBe('/memory-route/alpha');
      } finally {
        release();
        await navigation;
      }
    });

    it('isolates history stacks across memoryRoute instances, supports navigate(-1) after SSR redirect, and maps basename data loaders to the producer', async () => {
      const { page, lab, visit } = getContext();
      const loaderRequests: {
        pathname: string;
        probe: string;
        origin: string;
      }[] = [];
      page.on('request', (request: HTTPRequest) => {
        const url = new URL(request.url());
        if (
          request.method() === 'GET' &&
          url.searchParams.get('__loader') === detailLoaderId
        ) {
          loaderRequests.push({
            origin: url.origin,
            pathname: url.pathname,
            probe: url.searchParams.get('probe') || '',
          });
        }
      });

      await visit('memory-route/alpha', 'memory-host-layout');
      await page.waitForSelector(inPanel('csr', 'memory-demo-detail-data'));

      // Panel B hydrated after an SSR 302 redirect; navigate(-1) returns to preserved initialEntries[0] ('/')
      await page.click(inPanel('b', 'memory-demo-back'));
      await page.waitForSelector(inPanel('b', 'memory-demo-home'));
      expect(
        await page.$eval(
          inPanel('b', 'memory-demo-location'),
          node => node.textContent,
        ),
      ).toBe('/');
      // Other instances and Host URL are untouched
      expect(
        await page.$eval(
          inPanel('a', 'memory-demo-detail-data'),
          node => node.textContent,
        ),
      ).toBe('detail:11:specs:panel-a');
      expect(
        await page.$eval(
          inPanel('csr', 'memory-demo-detail-data'),
          node => node.textContent,
        ),
      ).toBe('detail:77:csr:panel-csr');
      expect(new URL(page.url()).pathname).toBe('/memory-route/alpha');

      // Panel A goes back to '/' then navigates to detail/99 with basename='/shop'
      await page.click(inPanel('a', 'memory-demo-back'));
      await page.waitForSelector(inPanel('a', 'memory-demo-home'));
      await page.click(inPanel('a', 'memory-demo-next-link'));
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          'detail:99:client:client-nav',
        {},
        inPanel('a', 'memory-demo-detail-data'),
      );
      const clientNavLoader = loaderRequests.filter(
        req => req.probe === 'client-nav',
      );
      expect(clientNavLoader).toHaveLength(1);
      expect(clientNavLoader[0].origin).toBe(
        `http://localhost:${lab.ports.provider}`,
      );
      expect(clientNavLoader[0].pathname).toBe('/memory-demo/detail/99');

      // Panel CSR can also navigate back independently
      await page.click(inPanel('csr', 'memory-demo-back'));
      await page.waitForSelector(inPanel('csr', 'memory-demo-home'));
      expect(new URL(page.url()).pathname).toBe('/memory-route/alpha');
    });

    it('keeps independent memoryRoute remotes mounted and stateful when the Host navigates across dynamic routes', async () => {
      const { page, visit } = getContext();
      await visit('memory-route/alpha', 'memory-host-layout');
      await page.waitForSelector(inPanel('persistent', 'memory-demo-home'));

      await page.click(inPanel('persistent', 'memory-demo-count'));
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent === 'Count: 1',
        {},
        inPanel('persistent', 'memory-demo-count'),
      );
      await page.click(inPanel('persistent', 'memory-demo-to-55'));
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent ===
          'detail:55:from-home:from-home',
        {},
        inPanel('persistent', 'memory-demo-detail-data'),
      );

      await page.evaluate(() => {
        (window as any).__persistentMemoryNode = document.querySelector(
          '[data-testid="memory-panel-persistent"] [data-testid="memory-demo-root"]',
        );
      });

      await page.click('[data-testid="memory-host-to-beta"]');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="memory-host-heading"]')
            ?.textContent === 'Section: beta',
      );
      expect(new URL(page.url()).pathname).toBe('/memory-route/beta');

      expect(
        await page.evaluate(
          () =>
            (window as any).__persistentMemoryNode ===
            document.querySelector(
              '[data-testid="memory-panel-persistent"] [data-testid="memory-demo-root"]',
            ),
        ),
      ).toBe(true);
      expect(
        await page.$eval(
          inPanel('persistent', 'memory-demo-count'),
          node => node.textContent,
        ),
      ).toBe('Count: 1');
      expect(
        await page.$eval(
          inPanel('persistent', 'memory-demo-detail-data'),
          node => node.textContent,
        ),
      ).toBe('detail:55:from-home:from-home');
    });
  },
  { memoryRoute: true },
);
