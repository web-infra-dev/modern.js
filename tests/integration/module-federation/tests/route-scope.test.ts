import { describeLab } from './fixture';

describeLab('Modern producer route exports', getContext => {
  it('retains the product error boundary and recovers without affecting another instance', async () => {
    const { page, visit } = getContext();
    await visit('route-exports', 'scope-product-list');
    await page.waitForSelector(
      '[data-testid="app-product-b"] [data-testid="scope-product-list"]',
    );
    await page.click(
      '[data-testid="app-product-a"] [data-testid="scope-detail-link"]',
    );
    await page.waitForSelector(
      '[data-testid="app-product-a"] [data-testid="scope-detail"]',
    );
    await page.click(
      '[data-testid="app-product-a"] [data-testid="scope-fail-link"]',
    );
    await page.waitForSelector(
      '[data-testid="app-product-a"] [data-testid="scope-error"]',
    );
    expect(
      await page.$eval(
        '[data-testid="app-product-a"]',
        element => element.textContent,
      ),
    ).toContain('Station loader unavailable');
    expect(
      await page.$(
        '[data-testid="app-product-b"] [data-testid="scope-product-list"]',
      ),
    ).not.toBeNull();
    await page.click(
      '[data-testid="app-product-a"] [data-testid="scope-recover-link"]',
    );
    await page.waitForSelector(
      '[data-testid="app-product-a"] [data-testid="scope-product-list"]',
    );
  });
  it('keeps the actual compiler dependency graph of each expose independent', async () => {
    const { lab } = getContext();
    const graphs = (await (
      await fetch(
        `http://localhost:${lab.ports.provider}/static/route-scope-graph.json`,
      )
    ).json()) as Record<string, string[]>;
    const includesRoute = (scope: string, route: string) =>
      graphs[scope].some(id =>
        id.replace(/\\/g, '/').includes(`/src/routes/${route}/page`),
      );
    expect(includesRoute('Weather', 'orders')).toBe(true);
    expect(includesRoute('Weather', 'product')).toBe(true);
    expect(includesRoute('Product', 'product')).toBe(true);
    expect(includesRoute('Product', 'orders')).toBe(false);
    expect(includesRoute('Orders', 'orders')).toBe(true);
    expect(includesRoute('Orders', 'product')).toBe(false);
    expect(
      graphs.Product.some(id => /[/\\]index[/\\]routes\.js/.test(id)),
    ).toBe(false);
  });
  it('mounts the full application, two product instances and another scope with retained layouts and loaders', async () => {
    const { page, visit } = getContext();
    await visit('route-exports', 'scope-product-list');
    await page.waitForSelector(
      '[data-testid="app-orders"] [data-testid="scope-orders"]',
    );
    await page.waitForSelector(
      '[data-testid="app-product-b"] [data-testid="scope-product-list"]',
    );
    for (const id of [
      'app-all',
      'app-product-a',
      'app-product-b',
      'app-orders',
    ]) {
      expect(
        await page.$eval(
          `[data-testid="${id}"]`,
          element => element.textContent,
        ),
      ).toContain('Root loader retained');
    }
    expect(
      await page.$eval(
        '[data-testid="app-product-a"]',
        element => element.textContent,
      ),
    ).toContain('Product loader retained');
    await page.click(
      '[data-testid="app-all"] [data-testid="scope-orders-link"]',
    );
    await page.waitForSelector(
      '[data-testid="app-all"] [data-testid="scope-orders"]',
    );
    expect(
      await page.$(
        '[data-testid="app-product-a"] [data-testid="scope-product-list"]',
      ),
    ).not.toBeNull();
  });
  it('keeps dynamic children and isolates navigation, updates, unmount and remount', async () => {
    const { page, visit } = getContext();
    await visit('route-exports', 'scope-product-list');
    await page.waitForSelector(
      '[data-testid="app-product-b"] [data-testid="scope-product-list"]',
    );
    await page.click(
      '[data-testid="app-product-a"] [data-testid="scope-count"]',
    );
    await page.click(
      '[data-testid="app-product-a"] [data-testid="scope-detail-link"]',
    );
    await page.waitForSelector(
      '[data-testid="app-product-a"] [data-testid="scope-detail"]',
    );
    expect(
      await page.$eval(
        '[data-testid="app-product-a"]',
        element => element.textContent,
      ),
    ).toContain('Weather station 42');
    expect(
      await page.$(
        '[data-testid="app-product-b"] [data-testid="scope-product-list"]',
      ),
    ).not.toBeNull();
    await page.click('[data-testid="scope-rename"]');
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="app-product-a"]')
        ?.textContent?.includes('Hilltop products'),
    );
    expect(
      await page.$eval(
        '[data-testid="app-product-a"]',
        element => element.textContent,
      ),
    ).toContain('Observations: 1');
    expect(
      await page.$(
        '[data-testid="app-product-a"] [data-testid="scope-detail"]',
      ),
    ).not.toBeNull();
    await page.click('[data-testid="scope-toggle"]');
    await page.waitForFunction(
      () =>
        !document.querySelector(
          '[data-testid="app-product-a"] [data-testid="scope-root"]',
        ),
    );
    await page.click('[data-testid="scope-toggle"]');
    await page.waitForSelector(
      '[data-testid="app-product-a"] [data-testid="scope-product-list"]',
    );
    expect(
      await page.$eval(
        '[data-testid="app-product-a"]',
        element => element.textContent,
      ),
    ).toContain('Observations: 0');
    expect(
      await page.$eval(
        '[data-testid="app-product-b"]',
        element => element.textContent,
      ),
    ).toContain('Riverside products');
  });
  it('removes sibling routes from the product scope while the whole application still reaches them', async () => {
    const { page, visit } = getContext();
    await visit('route-exports', 'scope-product-list');
    await page.click(
      '[data-testid="app-product-a"] [data-testid="scope-orders-link"]',
    );
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="app-product-a"]')
        ?.textContent?.includes('404'),
    );
    expect(
      await page.$(
        '[data-testid="app-product-a"] [data-testid="scope-orders"]',
      ),
    ).toBeNull();
    await page.click(
      '[data-testid="app-all"] [data-testid="scope-orders-link"]',
    );
    await page.waitForSelector(
      '[data-testid="app-all"] [data-testid="scope-orders"]',
    );
  });
});
