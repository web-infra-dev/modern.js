import type { LabContext } from './fixture';

export function comparisonCases(getContext: LabContext) {
  it('compares real CSR/SSR documents and isolates interactive weather frames', async () => {
    const { lab, page } = getContext();
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
    expect(
      await page.$eval(
        'select[aria-label="JavaScript startup delay"]',
        element => (element as HTMLSelectElement).value,
      ),
    ).toBe('0');
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
      ).toContain('Station saved');
      await frame.$eval(
        'input[aria-label="Adjust wind direction"]',
        element => {
          const input = element as HTMLInputElement;
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )!.set!;
          setter.call(input, '180');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        },
      );
      await frame.waitForFunction(
        () =>
          document.querySelector('[data-testid="wind-angle"]')?.textContent ===
          '180°',
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
      [...document.querySelectorAll('.comparison-panel>header')].every(header =>
        header.textContent?.includes('Interaction verified'),
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
    const delayedScript = page.waitForResponse(
      response => response.headers()['x-lab-script-delay'] === '1500',
    );
    await page.select('select[aria-label="JavaScript startup delay"]', '1500');
    await delayedScript;
    expect(delays).toContain('1500');
  });
  it('compares four data paths using a local API and the MF data loader', async () => {
    const { lab, page } = getContext();
    const normal = await (
      await fetch(`${lab.url}/weather?render=ssr&data=client&compact=1`)
    ).text();
    const prefetched = await (
      await fetch(`${lab.url}/weather?render=ssr&data=mf&compact=1`)
    ).text();
    expect(normal).toContain('data-source="pending"');
    expect(prefetched).toContain('data-source="Local weather API"');
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
      await frame.waitForSelector('[data-source="Local weather API"]');
      await frame.click('[data-testid="weather-save"]');
      expect(
        await frame.$eval(
          '[data-testid="weather-save"]',
          element => element.textContent,
        ),
      ).toContain('Station saved');
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
}
