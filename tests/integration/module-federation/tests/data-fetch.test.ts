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
    await page.goto(`${lab.url}/compare-data`, { waitUntil: 'networkidle0' });
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
});
