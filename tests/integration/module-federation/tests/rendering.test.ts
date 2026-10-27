import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describeLab } from './fixture';

const weather = 'weather?render=ssr&data=local';
describeLab('Weather rendering and assets', getContext => {
  it('renders a Modern weather remote in HTML, hydrates it and loads remote CSS and images', async () => {
    const { lab, page, visit, click, text } = getContext();
    const html = await (await fetch(`${lab.url}/${weather}`)).text();
    expect(html).toContain('Hangzhou');
    expect(html).toContain('Partly cloudy');
    await visit(weather, 'weather-current');
    await click('weather-save');
    expect(await text('weather-save')).toContain('Station saved');
    await page.waitForFunction(
      () =>
        (
          document.querySelector(
            '[data-testid="weather-station-icon"]',
          ) as HTMLImageElement
        )?.naturalWidth > 0,
    );
    const image = await page.$eval(
      '[data-testid="weather-station-icon"]',
      el => ({
        port: new URL((el as HTMLImageElement).src).port,
        width: getComputedStyle(el).width,
      }),
    );
    expect(image.port).toBe(String(lab.ports.provider));
    expect(image.width).toBe('14px');
  });
  it('renders dynamically registered Rslib hourly weather in HTML and hydrates it', async () => {
    const { lab, page, visit } = getContext();
    expect(await (await fetch(`${lab.url}/${weather}`)).text()).toContain(
      'Hourly forecast',
    );
    await visit(weather, 'weather-hourly');
    await page.waitForSelector(
      '[data-testid="weather-hourly"] button:not(:disabled)',
    );
    await page.click('[data-testid="weather-hourly"] button:nth-child(3)');
    expect(
      await page.$eval(
        '[data-testid="weather-hourly"] button:nth-child(3)',
        el => el.getAttribute('aria-pressed'),
      ),
    ).toBe('true');
    expect(
      await page.$eval('.hourly-weather .card-caption', el => el.textContent),
    ).toContain('16:00 · 28°');
  });
  it('renders daily weather through an independent nested Modern build', async () => {
    const { lab, page, visit } = getContext();
    expect(await (await fetch(`${lab.url}/${weather}`)).text()).toContain(
      '5-day forecast',
    );
    await visit(weather, 'weather-days');
    expect(await page.$$('[data-testid="weather-days"] .day-row')).toHaveLength(
      5,
    );
    expect(
      await page.$(
        '[data-lab-remote="nested/WeatherDays"] [data-lab-remote="provider/WeatherDays"]',
      ),
    ).not.toBeNull();
  });
  it('hydrates a dynamically nested Rslib wind remote and preserves local state', async () => {
    const { lab, page, visit, text } = getContext();
    expect(await (await fetch(`${lab.url}/${weather}`)).text()).toContain(
      'Wind flow simulation',
    );
    await visit(weather, 'weather-wind');
    await page.waitForSelector(
      '[aria-label="Adjust wind direction"]:not(:disabled)',
    );
    await page.$eval('[aria-label="Adjust wind direction"]', el => {
      const input = el as HTMLInputElement;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, '180');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="wind-angle"]')?.textContent ===
        '180°',
    );
    expect(await text('wind-angle')).toBe('180°');
    expect(
      await page.$(
        '[data-lab-remote="nested/WeatherWind"] [data-lab-remote="dynamic/WeatherWind"]',
      ),
    ).not.toBeNull();
  });
  it('uses the root Weather Lab and keeps its navigation within the client application', async () => {
    const { lab, page, weatherFrames } = getContext();
    await page.goto(`${lab.url}/`, { waitUntil: 'networkidle0' });
    expect(await weatherFrames(2)).toHaveLength(2);
    expect(await page.$('.sidebar')).toBeNull();
    await page.evaluate(() => {
      (window as any).navigationSentinel = 'preserved';
    });
    await page.click('a[href="/data"]');
    await page.waitForSelector('.four-panels');
    expect(await weatherFrames(4)).toHaveLength(4);
    await page.goBack();
    await page.waitForSelector('.comparison-grid:not(.four-panels)');
    expect(await weatherFrames(2)).toHaveLength(2);
    await page.goForward();
    await page.waitForSelector('.four-panels');
    expect(await page.evaluate(() => (window as any).navigationSentinel)).toBe(
      'preserved',
    );
  });
  it('removes the legacy demo routes instead of exposing a second application shell', async () => {
    const { lab } = getContext();
    for (const route of [
      'static',
      'dynamic',
      'nested',
      'dynamic-nested',
      'csr',
      'recovery',
      'lifecycle',
      'replace',
      'unified',
      'compare',
      'compare-data',
    ]) {
      expect((await fetch(`${lab.url}/${route}`)).status, route).toBe(404);
    }
  });
  it('serves custom manifest paths and all referenced server entry files', async () => {
    const { lab } = getContext();
    const manifest = await (
      await fetch(
        `http://localhost:${lab.ports.provider}/static/mf-manifest.json`,
      )
    ).json();
    expect(manifest.metaData.name).toBe('lab_provider');
    const server = manifest.metaData.ssrRemoteEntry;
    expect(server).toBeTruthy();
    const response = await fetch(
      new URL(
        `${server.path || ''}${server.name}`,
        manifest.metaData.ssrPublicPath,
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('lab_provider');
  });
  if (getContext().mode === 'dev')
    it('revalidates updated weather in development without stale server HTML', async () => {
      const { lab, workspace } = getContext();
      const source = path.join(workspace, 'provider/src/weather-ui.tsx');
      const original = await readFile(source, 'utf8');
      const marker = 'Hangzhou updated';
      expect(original).toContain('Hangzhou');
      expect(await (await fetch(`${lab.url}/${weather}`)).text()).toContain(
        'Hangzhou',
      );
      try {
        await writeFile(source, original.replace('Hangzhou', marker));
        await expect
          .poll(
            async () =>
              (
                await (
                  await fetch(`${lab.url}/${weather}`, {
                    signal: AbortSignal.timeout(10000),
                  })
                ).text()
              ).includes(marker),
            { timeout: 30000 },
          )
          .toBe(true);
      } finally {
        await writeFile(source, original);
        await expect
          .poll(
            async () =>
              !(
                await (
                  await fetch(`${lab.url}/${weather}`, {
                    signal: AbortSignal.timeout(10000),
                  })
                ).text()
              ).includes(marker),
            { timeout: 30000 },
          )
          .toBe(true);
      }
    });
});
