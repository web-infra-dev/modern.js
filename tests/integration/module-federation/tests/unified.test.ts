import { describeLab } from './fixture';

describeLab('Unified React remote API', getContext => {
  it('publishes per-expose Bridge metadata and preserves ordinary exposes', async () => {
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
      manifest.exposes.find((item: { name: string }) => item.name === 'Signal')
        .render,
    ).toBeUndefined();
  });
  it('SSR renders ordinary components and data while Bridge applications mount only in the client', async () => {
    const { lab, page, visit, counter } = getContext();
    const html = await (await fetch(`${lab.url}/unified`)).text();
    expect(html).toContain('A signal from another origin.');
    expect(html).toContain('modern-server');
    expect(html).toContain('Loading client application');
    expect(html).not.toContain('Bridge count:');
    await visit('unified', 'unified-bridge');
    await counter('signal');
    await page.waitForSelector('[data-testid="forecast"]');
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="unified-bridge"]').length ===
        2,
    );
    const cards = await page.$$('[data-testid="unified-bridge"]');
    await cards[0].$('button').then(button => button!.click());
    await page.waitForFunction(() =>
      document
        .querySelectorAll('[data-testid="unified-bridge"]')[0]
        ?.textContent?.includes('Bridge count: 1'),
    );
    expect(await cards[1].evaluate(element => element.textContent)).toContain(
      'Bridge count: 0',
    );
  });
  it('updates Bridge props without replacing its root and remounts a fresh instance', async () => {
    const { page, visit, selector } = getContext();
    await visit('unified', 'unified-bridge');
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="unified-bridge"]').length ===
        2,
    );
    await page.click('[data-testid="unified-bridge"] button');
    await page.click(selector('unified-update'));
    await page.waitForFunction(() => {
      const text = document.querySelector(
        '[data-testid="unified-bridge"]',
      )?.textContent;
      return (
        text?.includes('Updated application') &&
        text.includes('Bridge count: 1')
      );
    });
    await page.click(selector('unified-toggle'));
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="unified-bridge"]').length ===
        1,
    );
    await page.click(selector('unified-toggle'));
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="unified-bridge"]').length ===
        2,
    );
    expect(
      await page.$eval(
        '[data-testid="unified-bridge"]',
        element => element.textContent,
      ),
    ).toContain('Bridge count: 0');
  });
});
