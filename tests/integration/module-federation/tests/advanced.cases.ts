import type { LabContext } from './fixture';

export function advancedCases(getContext: LabContext) {
  it('replaces static and dynamic remotes with independently built version two', async () => {
    const { page, visit, text, click, selector } = getContext();
    await visit('replace', 'provider-forecast');
    await page.waitForSelector(selector('dynamic-forecast'));
    async function forecast(
      name: string,
      version: string,
      temperature: string,
      condition: string,
    ) {
      const id = `${name}-forecast`;
      await page.waitForFunction(
        (sel, expected) =>
          document.querySelector(sel)?.getAttribute('data-version') ===
          expected,
        {},
        selector(id),
        version,
      );
      expect(await text(`${id}-temperature`)).toBe(temperature);
      expect(await text(`${id}-condition`)).toBe(condition);
      await click(`${id}-counter`);
      expect(await text(`${id}-counter`)).toBe('Readings saved: 1');
    }
    await forecast('provider', 'v1', '24', 'Clear skies ahead.');
    await forecast('dynamic', 'v1', '24', 'Clear skies ahead.');
    await click('replace-provider');
    await forecast('provider', 'v2', '16', 'Rain is rolling in.');
    // Replacing the Modern remote must leave the other station on version one.
    expect(await text('dynamic-forecast-temperature')).toBe('24');
    await click('replace-dynamic');
    await forecast('dynamic', 'v2', '16', 'Rain is rolling in.');
  });
  it('isolates advanced replacement state when switching weather experiments', async () => {
    const { lab, page } = getContext();
    await page.goto(`${lab.url}/advanced`, { waitUntil: 'networkidle0' });
    let frame = page.frames().find(frame => frame.url().includes('/replace?'))!;
    await frame.waitForSelector(
      '[data-testid="provider-forecast"][data-version="v1"]',
    );
    await frame.click('[data-testid="replace-provider"]');
    await frame.waitForSelector(
      '[data-testid="provider-forecast"][data-version="v2"]',
    );
    await page.select('select[aria-label="Advanced scenarios"]', 'lifecycle');
    await page.waitForFunction(() =>
      document
        .querySelector('iframe')
        ?.contentDocument?.querySelector('[data-testid="request-count"]'),
    );
    frame = page.frames().find(frame => frame.url().includes('/lifecycle?'))!;
    await frame.waitForSelector('[data-testid="request-count"]');
    expect(
      await frame.$eval(
        '.lifecycle-temperature',
        element => element.textContent,
      ),
    ).toBe('30°');
    await page.select('select[aria-label="Advanced scenarios"]', 'replace');
    await page.waitForFunction(() =>
      document
        .querySelector('iframe')
        ?.contentDocument?.querySelector(
          '[data-testid="provider-forecast"][data-version="v1"]',
        ),
    );
  });
}
