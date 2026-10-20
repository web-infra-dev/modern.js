import type { LabContext } from './fixture';

export function inspectCases(getContext: LabContext) {
  it('inspects runtime remote identities and nested chains without remounting weather', async () => {
    const { lab, page } = getContext();
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
        '[data-testid="mf-inspect-outline"][data-mf-expose="./WeatherHourly"] .mf-inspect-source',
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
        await frame.$(
          '[data-mf-expose="./WeatherHourly"].mf-inspect-outline button',
        ),
      ).toBeNull();
      for (const [expose, producer, manifest] of [
        [
          'WeatherDays',
          'lab_provider',
          `http://localhost:${lab.ports.provider}/static/mf-manifest.json`,
        ],
        [
          'WeatherWind',
          'lab_library',
          `http://localhost:${lab.ports.library}/mf-manifest.json`,
        ],
      ]) {
        const selector = `[data-testid="mf-inspect-outline"][data-mf-expose="./${expose}"]`;
        const before = await frame.$eval(selector, element => ({
          name: element.getAttribute('data-mf-name'),
          color: getComputedStyle(element).borderTopColor,
          text: element.textContent,
        }));
        expect(before.name).toBe('lab_nested');
        expect(before.text).toContain(`lab_nested/${expose}`);
        expect(before.text).not.toContain(producer);
        expect(
          await frame.$eval(
            `${selector} a`,
            element => (element as HTMLAnchorElement).href,
          ),
        ).toBe(`http://localhost:${lab.ports.nested}/static/mf-manifest.json`);
        await frame.click(`${selector} button`);
        const expanded = await frame.$$eval(`${selector} a`, elements =>
          elements.map(element => ({
            text: element.textContent,
            url: (element as HTMLAnchorElement).href,
          })),
        );
        expect(expanded).toHaveLength(2);
        expect(expanded[1].text).toContain(`${producer}/${expose}`);
        expect(expanded[1].url).toBe(manifest);
        expect(
          await frame.$eval(
            selector,
            element => getComputedStyle(element).borderTopColor,
          ),
        ).toBe(before.color);
        await page.keyboard.press('Escape');
        expect(
          await frame.$eval(`${selector} button`, element =>
            element.getAttribute('aria-expanded'),
          ),
        ).toBe('false');
        await frame.click(`${selector} button`);
        await frame.click('[data-testid="weather-hourly"]');
        expect(
          await frame.$eval(`${selector} button`, element =>
            element.getAttribute('aria-expanded'),
          ),
        ).toBe('false');
      }
      expect(
        await frame.$eval(
          '[data-testid="weather-save"]',
          element => element.textContent,
        ),
      ).toContain('Station saved');
      expect(await frame.evaluate(() => (window as any).inspectSentinel)).toBe(
        'preserved',
      );
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
    const { lab, page } = getContext();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${lab.url}/compare-data`, { waitUntil: 'networkidle0' });
    const frames = page
      .frames()
      .filter(frame => frame.url().includes('/weather?'));
    const initial = [];
    for (const frame of frames) {
      await frame.waitForSelector('[data-source="Local weather API"]');
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
      ).toContain('Station saved');
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
      ).toContain('Station saved');
      expect(
        await frame.$(
          '[data-testid="mf-inspect-outline"][data-mf-expose$=".data"]',
        ),
      ).toBeNull();
    }
    expect(requests).toBe(0);
  });
}
