import { describeLab } from './fixture';

describeLab('Comparison UI', getContext => {
  it('compares real CSR/SSR documents and isolates interactive weather frames', async () => {
    const { lab, page, weatherFrames } = getContext();
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
    await page.waitForSelector('select[aria-label="JavaScript startup delay"]');
    expect(
      await page.$eval(
        'select[aria-label="JavaScript startup delay"]',
        element => (element as HTMLSelectElement).value,
      ),
    ).toBe('0');
    const frames = await weatherFrames(2);
    expect(frames).toHaveLength(2);
    for (const frame of frames) {
      await frame.waitForSelector(
        '[data-testid="weather-save"]:not(:disabled)',
      );
      await frame
        .waitForFunction(() =>
          Boolean(
            (window as any).__weatherMetrics?.['Data visible'] &&
            (window as any).__weatherMetrics?.['Client ready'],
          ),
        )
        .catch(async error => {
          throw new Error(
            JSON.stringify(
              await frame.evaluate(() => ({
                metrics: (window as any).__weatherMetrics,
                head: document.head.innerHTML.slice(0, 900),
                texts: Array.from(
                  document.querySelectorAll('[elementtiming]'),
                ).map(el => el.outerHTML),
                supported: PerformanceObserver.supportedEntryTypes,
              })),
            ),
            { cause: error },
          );
        });
      expect(
        await frame.evaluate(
          () => (window as any).__weatherMetrics['Data visible'].method,
        ),
      ).toBe('element timing');
      const readiness = await frame.evaluate(() => ({
        components: (window as any).__weatherComponentReady,
        metric: (window as any).__weatherMetrics['Client ready'],
      }));
      const expected =
        new URL(frame.url()).searchParams.get('compact') === '1'
          ? ['current', 'hourly']
          : ['current', 'hourly', 'wind'];
      expect(Object.keys(readiness.components).sort()).toEqual(expected.sort());
      expect(readiness.metric.at).toBe(
        Math.round(
          Math.max(...(Object.values(readiness.components) as number[])),
        ),
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
        header.textContent?.includes('Client ready'),
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
    const { lab, page, weatherFrames } = getContext();
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
    const frames = await weatherFrames(4);
    expect(frames).toHaveLength(4);
    for (const frame of frames) {
      await frame.waitForSelector('[data-source="Local weather API"]');
      await frame.waitForSelector(
        '[data-testid="weather-save"]:not(:disabled)',
      );
      await frame
        .waitForFunction(() =>
          Boolean(
            (window as any).__weatherMetrics?.['Data visible'] &&
            (window as any).__weatherMetrics?.['Client ready'],
          ),
        )
        .catch(async error => {
          throw new Error(
            JSON.stringify(
              await frame.evaluate(() => ({
                metrics: (window as any).__weatherMetrics,
                head: document.head.innerHTML.slice(0, 900),
                texts: Array.from(
                  document.querySelectorAll('[elementtiming]'),
                ).map(el => el.outerHTML),
                supported: PerformanceObserver.supportedEntryTypes,
              })),
            ),
            { cause: error },
          );
        });
      expect(
        await frame.evaluate(
          () => (window as any).__weatherMetrics['Data visible'].method,
        ),
      ).toBe('element timing');
      const readiness = await frame.evaluate(() => ({
        components: (window as any).__weatherComponentReady,
        metric: (window as any).__weatherMetrics['Client ready'],
      }));
      const expected =
        new URL(frame.url()).searchParams.get('compact') === '1'
          ? ['current', 'hourly']
          : ['current', 'hourly', 'wind'];
      expect(Object.keys(readiness.components).sort()).toEqual(expected.sort());
      expect(readiness.metric.at).toBe(
        Math.round(
          Math.max(...(Object.values(readiness.components) as number[])),
        ),
      );
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
      await page.$$eval('.comparison-panel > footer', footers =>
        footers.map(footer =>
          Array.from(footer.querySelectorAll('[data-metric]')).map(node =>
            node.getAttribute('data-metric'),
          ),
        ),
      ),
    ).toEqual(
      Array.from({ length: 4 }, () => ['Data visible', 'Client ready']),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  });
  it('records SSR data paint before hydration and reports client readiness only after controls are enabled', async () => {
    const { lab, page } = getContext();
    await page.setViewport({ width: 900, height: 700 });
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const path = new URL(request.url()).pathname;
      if (/^\/static\/js\/index(?:\.[\w]+)?\.js$/.test(path)) await gate;
      await request.continue();
    });
    const navigation = page.goto(
      `${lab.url}/weather?render=ssr&data=mf&compact=1`,
      { waitUntil: 'domcontentloaded' },
    );
    try {
      await page.waitForSelector(
        '[data-testid="weather-current"][data-source="Local weather API"]',
      );
      await page.waitForFunction(() =>
        Boolean((window as any).__weatherMetrics?.['Data visible']),
      );
      const before = await page.evaluate(() => ({
        visible: (window as any).__weatherMetrics['Data visible'],
        ready: (window as any).__weatherMetrics['Client ready'],
        hydrated: document.documentElement.dataset.labReady,
        disabled: (
          document.querySelector(
            '[data-testid="weather-save"]',
          ) as HTMLButtonElement
        ).disabled,
        temperature: document.querySelector(
          '[elementtiming="weather-temperature"]',
        )?.textContent,
        condition: document.querySelector('[elementtiming="weather-condition"]')
          ?.textContent,
      }));
      expect(before.visible.method).toBe('element timing');
      expect(before.visible.at).toBeGreaterThan(0);
      expect(before.temperature).toBe('30°');
      expect(before.condition).toBe('Partly cloudy');
      expect(before.ready).toBeUndefined();
      expect(before.hydrated).toBeUndefined();
      expect(before.disabled).toBe(true);
      release();
      await navigation;
      await page.waitForFunction(() =>
        Boolean((window as any).__weatherMetrics?.['Client ready']),
      );
      expect(
        await page.$eval(
          '[data-testid="weather-save"]',
          button => (button as HTMLButtonElement).disabled,
        ),
      ).toBe(false);
      await page.click('[data-testid="weather-save"]');
      expect(
        await page.$eval(
          '[data-testid="weather-save"]',
          button => button.textContent,
        ),
      ).toContain('Station saved');
      const after = await page.evaluate(() => (window as any).__weatherMetrics);
      expect(after['Data visible']).toEqual(before.visible);
      expect(after['Client ready'].at).toBeGreaterThan(before.visible.at);
    } finally {
      release();
      await navigation;
    }
  });

  it('waits for a delayed remote control before reporting the whole screen ready', async () => {
    const { lab, page } = getContext();
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      if (
        new URL(request.url()).pathname.includes(
          '__federation_expose_WeatherHourly',
        )
      )
        await gate;
      await request.continue();
    });
    try {
      await page.goto(`${lab.url}/weather?render=csr&csr=1&data=local`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForFunction(() => {
        const ready = (window as any).__weatherComponentReady;
        return ready?.current !== undefined && ready?.wind !== undefined;
      });
      const pending = await page.evaluate(() => ({
        components: (window as any).__weatherComponentReady,
        ready: (window as any).__weatherMetrics['Client ready'],
      }));
      expect(pending.components.hourly).toBeUndefined();
      expect(pending.ready).toBeUndefined();
      await page.click('[data-testid="weather-save"]');
      expect(
        await page.$eval(
          '[data-testid="weather-save"]',
          node => node.textContent,
        ),
      ).toContain('Station saved');
      release();
      await page.waitForFunction(() =>
        Boolean((window as any).__weatherMetrics['Client ready']),
      );
      const after = await page.evaluate(() => ({
        components: (window as any).__weatherComponentReady,
        ready: (window as any).__weatherMetrics['Client ready'],
      }));
      expect(after.ready.at).toBe(Math.round(after.components.hourly));
      await page.click('[data-testid="weather-hourly"] button:nth-child(2)');
      expect(
        await page.$eval(
          '[data-testid="weather-hourly"] button:nth-child(2)',
          node => node.getAttribute('aria-pressed'),
        ),
      ).toBe('true');
    } finally {
      release();
    }
  });

  for (const render of ['csr', 'ssr'])
    it(`reports ${render} client readiness and permits interaction while data is pending`, async () => {
      const { lab, page } = getContext();
      await page.setViewport({ width: 900, height: 700 });
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const url = `http://localhost:${lab.ports.api}/weather`;
      let notifyStarted!: () => void;
      const started = new Promise<void>(resolve => {
        notifyStarted = resolve;
      });
      await page.setRequestInterception(true);
      page.on('request', async request => {
        if (request.url() === url) {
          notifyStarted();
          await gate;
        }
        await request.continue();
      });
      try {
        await page.goto(
          `${lab.url}/weather?render=${render}&csr=${render === 'csr' ? 1 : 0}&data=client&compact=1`,
          { waitUntil: 'domcontentloaded' },
        );
        await started;
        await page.waitForSelector(
          '[data-testid="weather-current"][data-source="pending"]',
        );
        await page.waitForFunction(() =>
          Boolean((window as any).__weatherMetrics?.['Client ready']),
        );
        const pending = await page.evaluate(() => ({
          metrics: (window as any).__weatherMetrics,
          disabled: (
            document.querySelector(
              '[data-testid="weather-save"]',
            ) as HTMLButtonElement
          ).disabled,
        }));
        expect(pending.metrics['Data visible']).toBeUndefined();
        expect(pending.metrics['Client ready'].method).toBe(
          'component effects',
        );
        expect(pending.disabled).toBe(false);
        await page.click('[data-testid="weather-save"]');
        expect(
          await page.$eval(
            '[data-testid="weather-save"]',
            node => node.textContent,
          ),
        ).toContain('Station saved');
        await page.click('[data-testid="weather-hourly"] button:nth-child(2)');
        expect(
          await page.$eval(
            '[data-testid="weather-hourly"] button:nth-child(2)',
            node => node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
        release();
        await page.waitForFunction(() =>
          Boolean(
            (window as any).__weatherMetrics?.['Data visible'] &&
            (window as any).__weatherMetrics?.['Client ready'],
          ),
        );
        const after = await page.evaluate(
          () => (window as any).__weatherMetrics,
        );
        expect(after['Client ready']).toEqual(pending.metrics['Client ready']);
        expect(after['Data visible'].at).toBeGreaterThan(
          after['Client ready'].at,
        );
      } finally {
        release();
      }
    });

  it('uses a labeled visibility estimate when Element Timing is unavailable', async () => {
    const { lab, page } = getContext();
    await page.setViewport({ width: 900, height: 700 });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(PerformanceObserver, 'supportedEntryTypes', {
        value: PerformanceObserver.supportedEntryTypes.filter(
          type => type !== 'element',
        ),
      });
    });
    await page.goto(`${lab.url}/weather?render=ssr&data=mf&compact=1`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(() =>
      Boolean((window as any).__weatherMetrics?.['Data visible']),
    );
    expect(
      await page.evaluate(
        () => (window as any).__weatherMetrics['Data visible'].method,
      ),
    ).toBe('visibility estimate');
    expect(
      await page.$eval('[data-testid="weather-current"]', element =>
        element.getAttribute('data-source'),
      ),
    ).toBe('Local weather API');
  });
});
