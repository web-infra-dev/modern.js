import { describeLab } from './fixture';

describeLab('Data fetching', getContext => {
  it('serializes server-fetched remote data into the first HTML response', async () => {
    const { lab, page, visit, text, click } = getContext();
    const html = await (await fetch(`${lab.url}/weather?scenario=data`)).text();
    expect(html).toContain('modern-server');
    await visit('weather?scenario=data', 'provider-forecast');
    expect(
      await page.$eval(
        '[data-testid="provider-forecast"] [data-testid="data-source"]',
        el => el.textContent,
      ),
    ).toBe('modern-server');
    await click('provider-forecast-counter');
    expect(await text('provider-forecast-counter')).toBe('Readings saved: 1');
  });
  it('renders a CSR-only component and fetches data through the host server', async () => {
    const { lab, page, visit, text, click } = getContext();
    const html = await (await fetch(`${lab.url}/weather?scenario=data`)).text();
    expect(html).not.toContain('data-testid="library-forecast"');
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('x-mf-data-fetch'))
        requests.push(request.url());
    });
    await visit('weather?scenario=data', 'library-forecast');
    await page.waitForFunction(
      () =>
        document.querySelector(
          '[data-testid="library-forecast"] [data-testid="data-source"]',
        )?.textContent === 'rslib-server',
    );
    await click('library-forecast-counter');
    expect(await text('library-forecast-counter')).toBe('Readings saved: 1');
    expect(requests.length).toBeGreaterThan(0);
    expect(new URL(requests[0]).origin).toBe(lab.url);
    expect(new URL(requests[0]).searchParams.get('lab')).toBe('"federation"');
  });
  it('recovers server failures using the client loader and the host retry', async () => {
    const { page, visit, expectRecovery } = getContext();
    expectRecovery();
    await visit('weather?scenario=recovery', 'client-recovery');
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
    const { page, visit, text, click } = getContext();
    let noDataRequests = 0;
    page.on('request', request => {
      if (decodeURIComponent(request.url()).includes('NoData.data'))
        noDataRequests += 1;
    });
    await visit('weather?scenario=lifecycle', 'request-count');
    await page.waitForFunction(() =>
      /\d/.test(
        document.querySelector('[data-testid="request-count"]')?.textContent ||
          '',
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
          document.querySelector('[data-testid="request-count"]')?.textContent,
        ) > initial,
      {},
      count,
    );
    expect(await page.evaluate(() => (window as any).noDataLoads)).toBe(1);
    expect(noDataRequests).toBe(0);
  });
  it('keeps prefetch off until explicitly applied and reuses one data request per document', async () => {
    const { lab, page, weatherFrames } = getContext();
    await page.goto(`${lab.url}/data`, { waitUntil: 'networkidle0' });
    expect(
      await page.$eval(
        '.prefetch-control [role="checkbox"]',
        node => node.getAttribute('aria-checked') === 'true',
      ),
    ).toBe(false);
    expect(await weatherFrames(4)).toHaveLength(4);
    const before = await page.$$eval('iframe', nodes =>
      nodes.map(node => node.src),
    );
    await page.click('.prefetch-control [role="checkbox"]');
    expect(
      await page.$$eval('iframe', nodes => nodes.map(node => node.src)),
    ).toEqual(before);
    await page.click('[data-testid="render-apply"]');
    const frames = await weatherFrames(5);
    for (const frame of frames) {
      await frame.waitForSelector('[data-source="Local weather API"]');
      const query = new URL(frame.url()).searchParams;
      const result = await frame.evaluate(
        api => ({
          starts: performance.getEntriesByName('weather-prefetch-start').length,
          requests: performance
            .getEntriesByType('resource')
            .filter(entry => entry.name === `${api}/weather`).length,
        }),
        `http://localhost:${lab.ports.api}`,
      );
      const prefetched =
        query.get('render') === 'csr' &&
        query.get('data') === 'mf' &&
        query.get('prefetch') === '1';
      expect(result.starts).toBe(prefetched ? 1 : 0);
      expect(result.requests).toBe(
        query.get('render') === 'ssr' && query.get('data') === 'mf' ? 0 : 1,
      );
    }
  });
  it('makes prefetched data visible sooner from the same navigation start', async () => {
    const { lab, page } = getContext();
    const manifest = await (
      await fetch(
        `http://localhost:${lab.ports.provider}/static/mf-manifest.json`,
      )
    ).json();
    const expose = manifest.exposes.find(
      (item: any) => item.name === 'WeatherData',
    );
    expect(expose).toBeTruthy();
    const componentAssets: string[] = expose.assets.js.sync;
    expect(componentAssets.length).toBeGreaterThan(0);
    await page.setCacheEnabled(false);
    await page.setRequestInterception(true);
    let held = 0;
    page.on('request', async request => {
      const url = new URL(request.url());
      if (
        url.port === String(lab.ports.provider) &&
        componentAssets.some(asset => url.pathname.endsWith(`/${asset}`))
      ) {
        held += 1;
        // A controlled component download gives prefetch an opportunity to
        // overlap its real API request. Both navigations release at the same age.
        await page.waitForFunction(() => performance.now() >= 1800);
      }
      await request.continue();
    });
    const visible: number[] = [];
    for (const prefetch of [0, 1]) {
      held = 0;
      await page.goto(
        `${lab.url}/weather?render=csr&csr=1&data=mf&compact=1&prefetch=${prefetch}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForFunction(() =>
        Boolean((window as any).__weatherMetrics?.['Data visible']),
      );
      expect(held).toBeGreaterThan(0);
      const result = await page.evaluate(
        api => ({
          metric: (window as any).__weatherMetrics['Data visible'],
          temperature: document.querySelector(
            '[elementtiming="weather-temperature"]',
          )?.textContent,
          condition: document.querySelector(
            '[elementtiming="weather-condition"]',
          )?.textContent,
          requests: performance
            .getEntriesByType('resource')
            .filter(entry => entry.name === `${api}/weather`).length,
        }),
        `http://localhost:${lab.ports.api}`,
      );
      expect(result.metric.method).toBe('element timing');
      expect(result.temperature).toBe('30°');
      expect(result.condition).toBe('Partly cloudy');
      expect(result.requests).toBe(1);
      visible.push(result.metric.at);
    }
    expect(visible[0] - visible[1]).toBeGreaterThan(400);
  });
});
