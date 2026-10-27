import { describeLab } from './fixture';

describeLab('Failure recovery', getContext => {
  it('detects server-only rendering failure and recovers the remote in the client', async () => {
    const { lab, page, expectErrors } = getContext();
    const route =
      '/weather?render=ssr&data=local&failure=server&target=provider/Weather';
    const html = await (await fetch(`${lab.url}${route}`)).text();
    expect(html).toContain('<!--$!--><template');
    expect(html).not.toContain('data-testid="weather-current"');
    expectErrors(
      /LAB_REMOTE_RENDER: server|server could not finish|server rendering errored/i,
      0,
      1,
    );
    await page.goto(`${lab.url}${route}`, { waitUntil: 'domcontentloaded' });
    await page
      .waitForSelector('[data-testid="weather-save"]:not(:disabled)')
      .catch(async error => {
        throw new Error(
          JSON.stringify({
            body: await page.$eval('body', el =>
              el.textContent?.slice(0, 3000),
            ),
            errors: await page.$$eval('[data-error]', els =>
              els.map(el => el.getAttribute('data-error')),
            ),
            events: await page.evaluate(() => (window as any).labRecoveries),
          }),
          { cause: error },
        );
      });
    await page.waitForFunction(() =>
      (window as any).labRecoveries?.some(
        (event: any) => event.handler === 'Modern onBeforeRender',
      ),
    );
    await page.click('[data-testid="weather-save"]');
    expect(
      await page.$eval(
        '[data-testid="weather-save"]',
        element => element.textContent,
      ),
    ).toContain('Station saved');
  });

  it('handles a real remote 503 through the MF hook and adapter without breaking adjacent weather', async () => {
    const { lab, page } = getContext();
    const failures: number[] = [];
    page.on('response', response => {
      if (response.url().includes('/_lab/offline/'))
        failures.push(response.status());
    });
    await page.goto(
      `${lab.url}/weather?render=csr&csr=1&data=local&failure=network&target=dynamic/WeatherHourly`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForSelector('[data-handler="React remote fallback"]');
    expect(failures).toContain(503);
    expect(
      await page.evaluate(() =>
        (window as any).labRecoveries?.some(
          (event: any) => event.handler === 'MF errorLoadRemote',
        ),
      ),
    ).toBe(true);
    await page
      .waitForSelector('[data-testid="weather-save"]:not(:disabled)')
      .catch(async error => {
        throw new Error(
          JSON.stringify({
            body: await page.$eval('body', el =>
              el.textContent?.slice(0, 3000),
            ),
            errors: await page.$$eval('[data-error]', els =>
              els.map(el => el.getAttribute('data-error')),
            ),
            events: await page.evaluate(() => (window as any).labRecoveries),
          }),
          { cause: error },
        );
      });
    await page.click('[data-testid="weather-save"]');
    expect(
      await page.$eval(
        '[data-testid="weather-save"]',
        element => element.textContent,
      ),
    ).toContain('Station saved');
  });

  it('contains a broken remote release in a component boundary', async () => {
    const { lab, page } = getContext();
    await page.goto(
      `${lab.url}/weather?render=csr&csr=1&data=local&failure=render&target=provider/Weather`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForSelector('[data-handler="React remote fallback"]');
    expect(await page.$('[data-testid="weather-current"]')).toBeNull();
    await page.waitForSelector('.hourly-weather');
    expect(
      await page.evaluate(() =>
        (window as any).labRecoveries?.some(
          (event: any) => event.status === 'Component fallback',
        ),
      ),
    ).toBe(true);
  });

  it.each(['data', 'invalid'])(
    'contains a %s weather API failure in the MF data loader',
    async failure => {
      const { lab, page, expectErrors } = getContext();
      expectErrors(
        failure === 'data'
          ? /LAB_WEATHER_API: HTTP 503/
          : /LAB_WEATHER_API: Invalid temperature/,
        1,
        1,
      );
      const responses: number[] = [];
      page.on('response', response => {
        if (response.url().includes(`failure=${failure}`))
          responses.push(response.status());
      });
      await page.goto(
        `${lab.url}/weather?render=csr&csr=1&data=mf&prefetch=1&failure=${failure}&target=provider/Weather`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('[data-handler="React remote fallback"]');
      expect(responses).toContain(failure === 'data' ? 503 : 200);
      expect(await page.$('[data-testid="weather-current"]')).toBeNull();
    },
  );

  it.each(['nested/WeatherDays', 'nested/WeatherWind'])(
    'isolates an inner network failure in %s',
    async target => {
      const { lab, page } = getContext();
      const responses: string[] = [];
      page.on('response', response => {
        if (response.status() === 503) responses.push(response.url());
      });
      await page.goto(
        `${lab.url}/weather?csr=1&render=csr&data=local&failure=inner-network&target=${target}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('[data-handler="React remote fallback"]');
      const inner =
        target === 'nested/WeatherDays'
          ? 'provider_WeatherDays'
          : 'dynamic_WeatherWind';
      expect(responses.some(url => url.includes(`offline_${inner}`))).toBe(
        true,
      );
      expect(
        responses.some(url =>
          url.includes(`offline_${target.replace(/\W/g, '_')}`),
        ),
      ).toBe(false);
      await page.waitForSelector('[data-testid="weather-save"]:not(:disabled)');
      await page.click('[data-testid="weather-save"]');
      expect(
        await page.$eval(
          '[data-testid="weather-save"]',
          element => element.textContent,
        ),
      ).toContain('Station saved');
      expect(await page.$(`[data-mf-name="lab_nested"]`)).not.toBeNull();
    },
  );

  it.each(['network', 'server', 'render'])(
    'switches successful cached comparisons through %s failure and back',
    async failure => {
      const { lab, page, weatherFrames, expectErrors } = getContext();
      if (failure === 'server' || failure === 'render')
        expectErrors(
          /LAB_REMOTE_RENDER|server rendering errored|server could not finish|Minified React error #419/i,
          0,
          2,
        );
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${lab.url}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('html[data-lab-ready="true"]');
      await page.waitForSelector('[aria-label="Simulate failure"]');
      async function readyFrames(value: string) {
        await page.waitForFunction(
          expected =>
            Array.from(document.querySelectorAll('iframe')).every(frame => {
              try {
                return (
                  new URL(frame.contentWindow!.location.href).searchParams.get(
                    'failure',
                  ) === expected
                );
              } catch {
                return false;
              }
            }),
          {},
          value,
        );
        return weatherFrames(2);
      }
      for (const frame of await readyFrames(''))
        await frame.waitForSelector(
          '[data-testid="weather-save"]:not(:disabled)',
        );
      expect(await page.$('.recovery-badge')).toBeNull();
      await page.select('[aria-label="Failure scenario"]', failure);
      await page.click('[aria-label="Simulate failure"]');
      const frames = await readyFrames(failure);
      if (failure === 'server') {
        for (const frame of frames)
          await frame.waitForSelector(
            '[data-testid="weather-save"]:not(:disabled)',
          );
        await page.waitForFunction(
          () =>
            document.querySelectorAll('.recovery-badge').length === 1 &&
            document
              .querySelectorAll('.comparison-panel')[1]
              .querySelector('.recovery-badge')?.textContent ===
              'Client fallback',
        );
      } else {
        for (const frame of frames)
          await frame.waitForSelector('[data-testid="recovery-card"]');
        await page.waitForFunction(
          () => document.querySelectorAll('.recovery-badge').length === 2,
        );
      }
      for (const frame of frames)
        await frame.waitForSelector('[data-testid="weather-hourly"]');
      await page.click('[aria-label="Simulate failure"]');
      for (const frame of await readyFrames('')) {
        await frame.waitForSelector(
          '[data-testid="weather-save"]:not(:disabled)',
        );
        expect(await frame.$('[data-testid="recovery-card"]')).toBeNull();
      }
      expect(await page.$('.recovery-badge')).toBeNull();
    },
  );

  it.each(['data', 'invalid'])(
    'handles %s API failure during server data loading',
    async failure => {
      const { lab, page, expectErrors } = getContext();
      expectErrors(/Hydration failed|Minified React error #418/, 0, 1);
      const route = `/weather?render=ssr&data=mf&failure=${failure}&target=provider/Weather`;
      const response = await fetch(`${lab.url}${route}`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('data-handler="React remote fallback"');
      expect(html).not.toContain('data-testid="weather-current"');
      await page.goto(`${lab.url}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-handler="React remote fallback"]');
      await page.waitForFunction(() =>
        (window as any).labRecoveries?.some(
          (event: any) => event.status === 'Data fallback',
        ),
      );
      await page.waitForSelector('[data-testid="weather-hourly"]');
    },
  );

  it.each(['replace', 'lifecycle', 'recovery'])(
    'exercises failure and restoration in advanced %s',
    async scenario => {
      const { lab, page, expectErrorGroups } = getContext();
      if (scenario === 'recovery')
        expectErrorGroups([
          { pattern: /Hydration failed|Minified React error #418/, count: 4 },
          { pattern: /LAB_WEATHER_API: HTTP 503/, count: 1 },
        ]);
      await page.goto(`${lab.url}/advanced`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[aria-label="Advanced scenarios"]');
      await page.select('[aria-label="Advanced scenarios"]', scenario);
      await page.waitForFunction(
        scenario => {
          const doc = document.querySelector('iframe')?.contentDocument;
          if (scenario === 'recovery')
            return (
              doc?.querySelector(
                '[data-testid="server-recovery"] [data-testid="data-source"]',
              )?.textContent === 'server-recovery'
            );
          return Boolean(
            doc?.querySelector(
              `[data-testid="${scenario === 'replace' ? 'provider-forecast' : 'request-count'}"]`,
            ),
          );
        },
        {},
        scenario,
      );
      if (scenario === 'recovery') {
        // SSR markup can appear before the two client recoveries finish.
        // Finish this navigation before the failure toggle replaces its iframe.
        await page.waitForFunction(() => {
          const events = (
            document.querySelector('iframe')?.contentWindow as any
          )?.labRecoveries;
          return (
            events?.some(
              (event: any) => event.status === 'Client loader fallback',
            ) &&
            events?.some((event: any) => event.status === 'Host retry fallback')
          );
        });
      }
      const kind = scenario === 'replace' ? 'network' : 'data';
      await page.select('[aria-label="Failure scenario"]', kind);
      await page.click('[aria-label="Simulate failure"]');
      async function currentFrame(enabled: boolean) {
        await page
          .waitForFunction(
            ({ scenario, enabled, kind }) => {
              const frame = document.querySelector('iframe');
              try {
                const url = new URL(frame!.contentWindow!.location.href);
                return (
                  url.pathname === '/weather' &&
                  url.searchParams.get('scenario') === scenario &&
                  url.searchParams.get('failure') === (enabled ? kind : '')
                );
              } catch {
                return false;
              }
            },
            {},
            { scenario, enabled, kind },
          )
          .catch(async error => {
            throw new Error(
              JSON.stringify(
                await page.evaluate(() => ({
                  src: document.querySelector('iframe')?.src,
                  url: document.querySelector('iframe')?.contentWindow?.location
                    .href,
                  checked: (
                    document.querySelector(
                      '[aria-label="Simulate failure"]',
                    ) as HTMLInputElement
                  )?.checked,
                  kind: (
                    document.querySelector(
                      '[aria-label="Failure scenario"]',
                    ) as HTMLSelectElement
                  )?.value,
                })),
              ),
              { cause: error },
            );
          });
        return page
          .frames()
          .find(frame => frame.url().includes(`scenario=${scenario}`))!;
      }
      let frame = await currentFrame(true);
      await frame.waitForFunction(
        () => document.documentElement?.dataset.labReady === 'true',
      );
      if (scenario === 'replace') {
        await frame.waitForSelector(
          '[data-testid="provider-forecast"][data-version="v1"]',
        );
        expect(await frame.$('[data-testid="recovery-card"]')).toBeNull();
        await frame.waitForSelector(
          '[data-testid="replace-provider"]:not(:disabled)',
        );
        await frame.click('[data-testid="replace-provider"]');
      } else if (scenario === 'lifecycle') {
        await frame.waitForSelector('[data-testid="request-count"]');
        await frame.waitForFunction(() =>
          /\d/.test(
            document.querySelector('[data-testid="request-count"]')
              ?.textContent || '',
          ),
        );
        await frame.click('[data-testid="rerender"]');
        expect(await frame.$('[data-testid="recovery-card"]')).toBeNull();
        await frame.click('[data-testid="remount"]');
      }
      await frame
        .waitForSelector(
          scenario === 'replace'
            ? '[data-handler="MF runtime fallback"]'
            : '[data-handler="React remote fallback"]',
        )
        .catch(async error => {
          throw new Error(
            JSON.stringify(
              await frame.evaluate(() => ({
                body: document.body.innerText,
                events: (window as any).labRecoveries,
              })),
            ),
            { cause: error },
          );
        });
      await page.waitForFunction(
        expected =>
          document.querySelector('.recovery-badge')?.textContent === expected,
        {},
        scenario === 'replace' ? 'Remote fallback' : 'Data fallback',
      );
      if (scenario === 'replace')
        expect(
          await frame.$('[data-testid="dynamic-forecast"][data-version="v1"]'),
        ).not.toBeNull();
      if (scenario === 'lifecycle')
        expect(await frame.$('[data-testid="no-data"]')).not.toBeNull();
      await page.click('[aria-label="Simulate failure"]');
      frame = await currentFrame(false);
      await frame.waitForFunction(
        () => document.documentElement?.dataset.labReady === 'true',
      );
      await frame.waitForSelector(
        `[data-testid="${scenario === 'replace' ? 'provider-forecast' : scenario === 'lifecycle' ? 'request-count' : 'server-recovery'}"]`,
      );
      if (scenario === 'recovery') {
        await frame.waitForFunction(
          () =>
            document.querySelector(
              '[data-testid="server-recovery"] [data-testid="data-source"]',
            )?.textContent === 'server-recovery',
        );
        await frame.waitForFunction(
          () =>
            (window as any).labRecoveries?.some(
              (event: any) => event.status === 'Client loader fallback',
            ) &&
            (window as any).labRecoveries?.some(
              (event: any) => event.status === 'Host retry fallback',
            ),
        );
      }
      expect(await frame.$('[data-testid="recovery-card"]')).toBeNull();
    },
  );
  it('shows actual data fallbacks in all four panels and restores prefetched data', async () => {
    const { lab, page, weatherFrames, expectErrors } = getContext();
    expectErrors(
      /LAB_WEATHER_API: HTTP 503|Hydration failed|Minified React error #418/,
      1,
      2,
    );
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${lab.url}/data`, { waitUntil: 'networkidle0' });
    for (const frame of await weatherFrames(4))
      await frame.waitForSelector(
        '[data-testid="weather-save"]:not(:disabled)',
      );
    expect(
      await page.$eval(
        '.prefetch-control input',
        el => (el as HTMLInputElement).checked,
      ),
    ).toBe(true);
    await page.select('[aria-label="Failure scenario"]', 'data');
    await page.click('[aria-label="Simulate failure"]');
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('iframe')).every(frame =>
        frame.contentWindow?.location.search.includes('failure=data'),
      ),
    );
    for (const frame of await weatherFrames(4)) {
      await frame.waitForSelector('[data-testid="recovery-card"]');
      await frame.waitForSelector('[data-testid="weather-hourly"]');
    }
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.recovery-badge')).length === 4 &&
        Array.from(document.querySelectorAll('.recovery-badge')).every(
          el => el.textContent === 'Data fallback',
        ),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    if (process.env.MF_LAB_SCREENSHOTS)
      await page.screenshot({ path: '/tmp/mf-data-failure.png' });
    await page.click('[aria-label="Simulate failure"]');
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('iframe')).every(
        frame =>
          new URL(frame.contentWindow!.location.href).searchParams.get(
            'failure',
          ) === '',
      ),
    );
    for (const frame of await weatherFrames(4)) {
      await frame.waitForSelector(
        '[data-testid="weather-save"]:not(:disabled)',
      );
      expect(await frame.$('[data-testid="recovery-card"]')).toBeNull();
    }
    expect(await page.$('.recovery-badge')).toBeNull();
    if (process.env.MF_LAB_SCREENSHOTS)
      await page.screenshot({ path: '/tmp/mf-comparison-restored.png' });
  });
});
