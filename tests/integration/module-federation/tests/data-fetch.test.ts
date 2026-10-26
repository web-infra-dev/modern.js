import { describeLab } from './fixture';

describeLab('Data fetching', getContext => {
  it('serializes server-fetched remote data into the first HTML response', async () => {
    const { lab, visit, text, click } = getContext();
    const html = await (await fetch(`${lab.url}/data`)).text();
    expect(html).toContain('modern-server');
    await visit('data', 'forecast');
    expect(await text('data-source')).toBe('modern-server');
    await click('forecast-counter');
    expect(await text('forecast-counter')).toBe('Readings saved: 1');
  });
  it('renders a CSR-only component and fetches data through the host server', async () => {
    const { lab, page, visit, text, click } = getContext();
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
    const { page, visit, expectRecovery } = getContext();
    expectRecovery();
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
    const { page, visit, text, click } = getContext();
    let noDataRequests = 0;
    page.on('request', request => {
      if (decodeURIComponent(request.url()).includes('NoData.data'))
        noDataRequests += 1;
    });
    await visit('lifecycle', 'request-count');
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
  it('prefetches CSR weather data by default and reuses one request when rendering', async () => {
    const { lab, page, weatherFrames } = getContext();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${lab.url}/compare-data`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('html[data-lab-ready="true"]');
    await page.waitForSelector('.prefetch-control input');
    expect(
      await page.$eval(
        '.prefetch-control input',
        element => (element as HTMLInputElement).checked,
      ),
    ).toBe(true);
    const sources: string[] = [];
    for (const enabled of [true, false]) {
      const frames = await weatherFrames(4);
      expect(frames).toHaveLength(4);
      for (const [index, frame] of frames.entries()) {
        await frame.waitForSelector('[data-source="Local weather API"]');
        await frame.waitForSelector(
          '[data-testid="weather-save"]:not(:disabled)',
        );
        const result = await frame.evaluate(
          api => ({
            starts: performance
              .getEntriesByName('weather-prefetch-start')
              .map(entry => entry.startTime),
            requests: performance
              .getEntriesByType('resource')
              .filter(entry => entry.name === `${api}/weather`)
              .map(entry => entry.startTime),
            source: document.querySelector('.weather-source')!.textContent!,
          }),
          `http://localhost:${lab.ports.api}`,
        );
        expect(result.starts).toHaveLength(enabled && index === 2 ? 1 : 0);
        expect(result.requests).toHaveLength(index === 3 ? 0 : 1);
        if (enabled && index === 2)
          expect(result.requests[0]).toBeGreaterThanOrEqual(result.starts[0]);
        if (enabled) sources.push(result.source);
        else expect(result.source).not.toBe(sources[index]);
        await frame.click('[data-testid="weather-save"]');
        expect(
          await frame.$eval(
            '[data-testid="weather-save"]',
            element => element.textContent,
          ),
        ).toContain('Station saved');
      }
      if (enabled) {
        await page.click('.prefetch-control input');
      }
    }
    expect(
      await page.$eval(
        '.prefetch-control input',
        element => (element as HTMLInputElement).checked,
      ),
    ).toBe(false);
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
