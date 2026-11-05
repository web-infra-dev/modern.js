import type { HTTPRequest, HTTPResponse } from 'puppeteer';
import { describeLab } from './fixture';

const instance = (name: string) => `[data-testid="isolation-${name}"]`;
const child = (name: string, target: string) =>
  `${instance(name)} [data-testid="isolation-${target}"]`;
const detailId = 'isolation/(lang)/detail/(id)/page';

describeLab(
  'Application i18n and route prefetch isolation',
  getContext => {
    it('restores each server locale and loader result, retaining the streamed DOM beside a different Host locale', async () => {
      const { page, lab } = getContext();
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const pageDataRequests: string[] = [];
      await page.setRequestInterception(true);
      page.on('request', async request => {
        const url = new URL(request.url());
        if (url.searchParams.get('__loader') === 'isolation/(lang)/page') {
          pageDataRequests.push(url.searchParams.get('probe') || '');
        }
        if (
          url.origin === lab.url &&
          /^\/static\/js\/index(?:\.[\w]+)?\.js$/.test(url.pathname)
        )
          await gate;
        if (!request.isInterceptResolutionHandled()) await request.continue();
      });
      const navigation = page.goto(`${lab.url}/isolation/zh`, {
        waitUntil: 'domcontentloaded',
      });
      try {
        await page.waitForFunction(() =>
          ['one', 'two'].every(name =>
            document.querySelector(
              `[data-testid="isolation-${name}"] [data-testid="isolation-producer"]`,
            ),
          ),
        );
        expect(
          await page.$eval(child('one', 'greeting'), node => node.textContent),
        ).toBe('Producer hello');
        expect(
          await page.$eval(child('two', 'greeting'), node => node.textContent),
        ).toBe('Producteur bonjour');
        expect(
          await page.$eval(
            '[data-testid="isolation-host-greeting"]',
            node => node.textContent,
          ),
        ).toBe('主应用你好');
        expect(await page.$(child('csr', 'producer'))).toBeNull();
        expect(
          await page.evaluate(
            () => document.documentElement.dataset.isolationReady,
          ),
        ).toBeUndefined();
        await page.evaluate(() => {
          (window as any).__isolationServerNodes = ['one', 'two'].map(name =>
            document.querySelector(
              `[data-testid="isolation-${name}"] [data-testid="isolation-producer"]`,
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
        ).toHaveLength(2);
        expect(frames.some(([, frame]) => frame.type === 'error')).toBe(false);
        await page.waitForSelector('html[data-isolation-ready="true"]');
        await page.waitForSelector(child('csr', 'producer'));
        expect(
          await page.evaluate(
            () => (window as any)._SSR_DATA.data.i18nData.lng,
          ),
        ).toBe('zh');
        expect(
          await page.$eval(child('one', 'greeting'), node => node.textContent),
        ).toBe('Producer hello');
        expect(
          await page.$eval(child('two', 'greeting'), node => node.textContent),
        ).toBe('Producteur bonjour');
        expect(
          await page.$eval(child('csr', 'greeting'), node => node.textContent),
        ).toBe('Producer hello');
        for (const name of ['one', 'two', 'csr'])
          expect(
            await page.$eval(child(name, 'data'), node => node.textContent),
          ).toBe(`producer:${name}`);
        expect(
          await page.$eval(
            '[data-testid="isolation-host-data"]',
            node => node.textContent,
          ),
        ).toBe('host:host');
        expect(
          pageDataRequests.filter(probe => probe === 'one' || probe === 'two'),
        ).toEqual([]);
        expect(pageDataRequests.filter(probe => probe === 'csr')).toHaveLength(
          1,
        );
        expect(
          await page.evaluate(() =>
            ['one', 'two'].every(
              (name, index) =>
                (window as any).__isolationServerNodes[index] ===
                document.querySelector(
                  `[data-testid="isolation-${name}"] [data-testid="isolation-producer"]`,
                ),
            ),
          ),
        ).toBe(true);
        expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
      } finally {
        release();
        await navigation;
      }
    });

    it('keeps language changes and interaction local to one mount of the same producer', async () => {
      const { page, visit } = getContext();
      await visit('isolation/zh', 'isolation-producer');
      await page.waitForSelector(child('csr', 'producer'));
      await page.click(child('one', 'count'));
      await page.click(child('one', 'language'));
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent === '生产者你好',
        {},
        child('one', 'greeting'),
      );
      expect(
        await page.$eval(child('one', 'count'), node => node.textContent),
      ).toBe('Count: 1');
      expect(
        await page.$eval(child('two', 'greeting'), node => node.textContent),
      ).toBe('Producteur bonjour');
      expect(
        await page.$eval(child('two', 'count'), node => node.textContent),
      ).toBe('Count: 0');
      expect(
        await page.$eval(child('csr', 'greeting'), node => node.textContent),
      ).toBe('Producer hello');
      expect(
        await page.$eval(
          '[data-testid="isolation-host-greeting"]',
          node => node.textContent,
        ),
      ).toBe('主应用你好');
    });

    it('prefetches producer data and route code on render and intent while none/default stay idle', async () => {
      const { page, lab, visit } = getContext();
      const requests: HTTPRequest[] = [];
      const scripts: HTTPResponse[] = [];
      page.on('request', request => {
        if (new URL(request.url()).searchParams.has('__loader'))
          requests.push(request);
      });
      page.on('response', response => {
        if (response.request().resourceType() === 'script')
          scripts.push(response);
      });
      await visit('isolation/zh', 'isolation-producer');
      await page.waitForSelector(child('csr', 'producer'));
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('link[rel="prefetch"]')).some(
          node => (node as HTMLLinkElement).href.includes('probe=one-render'),
        ),
      );
      await page.waitForNetworkIdle({ idleTime: 200 });
      const prefetched = (probe: string) =>
        requests.filter(request => {
          const url = new URL(request.url());
          return (
            url.searchParams.get('probe') === probe &&
            url.searchParams.get('__loader') === detailId
          );
        });
      for (const [name, lang] of [
        ['one', 'en'],
        ['two', 'fr'],
        ['csr', 'en'],
      ]) {
        expect(prefetched(`${name}-render`)).toHaveLength(1);
        const request = prefetched(`${name}-render`)[0];
        const url = new URL(request.url());
        expect(url.origin).toBe(`http://localhost:${lab.ports.provider}`);
        expect(url.pathname).toBe(`/isolation/${lang}/detail/render`);
        expect(url.searchParams.get('__ssrDirect')).toBe('true');
        expect(request.response()?.status()).toBe(200);
        expect(prefetched(`${name}-intent`)).toHaveLength(0);
        expect(prefetched(`${name}-none`)).toHaveLength(0);
        expect(prefetched(`${name}-default`)).toHaveLength(0);
      }
      const producerScripts = scripts.filter(
        response => new URL(response.url()).port === String(lab.ports.provider),
      );
      const producerCode = await Promise.all(
        producerScripts.map(response => response.text()),
      );
      expect(
        producerCode.some(code => code.includes('isolation-producer-detail')),
      ).toBe(true);
      expect(
        await page.$('[data-testid="isolation-producer-detail"]'),
      ).toBeNull();
      await page.focus(child('one', 'intent'));
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('link[rel="prefetch"]')).some(
          node => (node as HTMLLinkElement).href.includes('probe=one-intent'),
        ),
      );
      await page.waitForNetworkIdle({ idleTime: 200 });
      expect(prefetched('one-intent')).toHaveLength(1);
      expect(new URL(prefetched('one-intent')[0].url()).pathname).toBe(
        '/isolation/en/detail/intent',
      );
      await page.hover(child('one', 'none'));
      await page.waitForNetworkIdle({ idleTime: 200 });
      expect(prefetched('one-none')).toHaveLength(0);
      expect(prefetched('one-default')).toHaveLength(0);
      await page.click(child('one', 'render'));
      await page.waitForSelector(child('one', 'producer-detail'));
      expect(
        await page.$eval(
          child('one', 'producer-detail'),
          node => node.textContent,
        ),
      ).toBe('producer detail:render:one-render');
      expect(
        await page.$eval(child('two', 'data'), node => node.textContent),
      ).toBe('producer:two');
    });

    it('retains ordinary Host Link prefetch origin, paths and intent/render/none behavior', async () => {
      const { page, lab, visit } = getContext();
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        if (new URL(request.url()).searchParams.has('__loader'))
          requests.push(request);
      });
      await visit('isolation/zh', 'isolation-producer');
      await page.waitForNetworkIdle({ idleTime: 200 });
      const hostRequests = (behavior: string) =>
        requests.filter(
          request =>
            new URL(request.url()).searchParams.get('probe') ===
            `host-${behavior}`,
        );
      expect(hostRequests('render')).toHaveLength(1);
      const renderUrl = new URL(hostRequests('render')[0].url());
      expect(renderUrl.origin).toBe(lab.url);
      expect(renderUrl.pathname).toBe('/isolation/zh/detail/render');
      expect(renderUrl.searchParams.get('__loader')).toBe(detailId);
      expect(hostRequests('intent')).toHaveLength(0);
      await page.hover('[data-testid="isolation-host-intent"]');
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('link[rel="prefetch"]')).some(
          node => (node as HTMLLinkElement).href.includes('probe=host-intent'),
        ),
      );
      await page.waitForNetworkIdle({ idleTime: 200 });
      expect(hostRequests('intent')).toHaveLength(1);
      expect(hostRequests('intent')[0].response()?.status()).toBe(200);
      await page.hover('[data-testid="isolation-host-none"]');
      await page.waitForNetworkIdle({ idleTime: 200 });
      expect(hostRequests('none')).toHaveLength(0);
      expect(hostRequests('default')).toHaveLength(0);
      await page.click('[data-testid="isolation-host-render"]');
      await page.waitForSelector('[data-testid="isolation-host-detail"]');
      expect(
        await page.$eval(
          '[data-testid="isolation-host-detail"]',
          node => node.textContent,
        ),
      ).toBe('host detail:render');
    });
  },
  { applicationIsolation: true },
);
