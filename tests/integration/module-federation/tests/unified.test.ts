import { describeLab } from './fixture';

const route = 'weather?scenario=bridge';
describeLab('Independent weather applications', getContext => {
  it('marks the weather Bridge provider and preserves ordinary weather expose metadata', async () => {
    const { lab } = getContext();
    const manifest = await (
      await fetch(
        `http://localhost:${lab.ports.provider}/static/mf-manifest.json`,
      )
    ).json();
    expect(
      manifest.exposes.find(
        (item: { name: string }) => item.name === 'BridgeCard',
      ),
    ).toMatchObject({ render: 'bridge', isService: false });
    expect(
      manifest.exposes.find((item: { name: string }) => item.name === 'Weather')
        .render,
    ).toBeUndefined();
  });
  it('selects client Bridge rendering automatically and mounts independent weather station roots', async () => {
    const { lab, page, visit } = getContext();
    const html = await (await fetch(`${lab.url}/${route}`)).text();
    expect(html).toContain('Connecting to independent weather station');
    expect(html).toContain('data-mf-bridge');
    expect(html).not.toContain('Observations saved:');
    await visit(route, 'bridge-station');
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="bridge-station"]').length ===
        2,
    );
    const stations = await page.$$('[data-testid="bridge-station"]');
    await stations[0]
      .$('[data-testid="station-observation"]')
      .then(button => button!.click());
    await page.waitForFunction(() =>
      document
        .querySelectorAll('[data-testid="bridge-station"]')[0]
        ?.textContent?.includes('Observations saved: 1'),
    );
    expect(await stations[1].evaluate(el => el.textContent)).toContain(
      'Observations saved: 0',
    );
    await page.waitForSelector(
      '[data-testid="bridge-station"] [data-testid="weather-save"]:not(:disabled)',
    );
    await page.click(
      '[data-testid="bridge-station"] [data-testid="weather-save"]',
    );
    expect(await stations[0].evaluate(el => el.textContent)).toContain(
      'Station saved',
    );
    expect(await stations[1].evaluate(el => el.textContent)).toContain(
      'Save station',
    );
  });
  it('updates station props without replacing its root and reconnects a fresh instance through Advanced', async () => {
    const { lab, page } = getContext();
    await page.goto(`${lab.url}/advanced`, { waitUntil: 'networkidle0' });
    await page.select('[aria-label="Advanced scenarios"]', 'bridge');
    await page.waitForFunction(
      () =>
        document
          .querySelector('iframe')
          ?.contentDocument?.querySelectorAll('[data-testid="bridge-station"]')
          .length === 2,
    );
    const frame = page
      .frames()
      .find(frame => frame.url().includes('scenario=bridge'))!;
    await frame.click('[data-testid="station-observation"]');
    await frame.click('[data-testid="station-update"]');
    await frame.waitForFunction(() => {
      const text = document.querySelector(
        '[data-testid="bridge-station"]',
      )?.textContent;
      return (
        text?.includes('Lakeside station') &&
        text.includes('Observations saved: 1')
      );
    });
    await frame.click('[data-testid="station-toggle"]');
    await frame.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="bridge-station"]').length ===
        1,
    );
    await frame.click('[data-testid="station-toggle"]');
    await frame.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="bridge-station"]').length ===
        2,
    );
    expect(
      await frame.$eval('[data-testid="bridge-station"]', el => el.textContent),
    ).toContain('Observations saved: 0');
  });
});
