import { describeLab } from './fixture';

describeLab('Modern producer route exports', getContext => {
  it('isolates two complete weather applications through navigation, props and remounts', async () => {
    const { page, visit, click } = getContext();
    await visit('weather-instances', 'weather-instance-a');
    const a = '[data-testid="weather-instance-a"]';
    const b = '[data-testid="weather-instance-b"]';
    await page.waitForSelector(
      `${a} [data-testid="weather-save"]:not(:disabled)`,
    );
    await page.waitForSelector(
      `${b} [data-testid="weather-save"]:not(:disabled)`,
    );
    await page.click(`${a} [data-testid="weather-save"]`);
    await page.click(`${a} [data-testid="forecast-wed"]`);
    await page.waitForSelector(`${a} [data-testid="outlook-resolved"]`);
    await page.click(`${a} [data-testid="save-day"]`);
    expect(
      await page.$eval(
        `${a} [data-testid="favorite-count"]`,
        node => node.textContent,
      ),
    ).toBe('2');
    expect(
      await page.$eval(
        `${b} [data-testid="favorite-count"]`,
        node => node.textContent,
      ),
    ).toBe('0');
    expect(
      await page.$(`${b} [data-testid="weather-overview"]`),
    ).not.toBeNull();
    await click('instances-rename');
    await page.waitForFunction(
      selector =>
        document.querySelector(selector)?.textContent?.includes('West Lake'),
      {},
      `${a} [data-testid="weather-detail"]`,
    );
    expect(
      await page.$eval(
        `${b} [data-testid="weather-current"] h1`,
        node => node.textContent,
      ),
    ).toBe('Riverside');
    await page.click(`${b} [data-testid="weather-save"]`);
    await page.evaluate(selector => {
      (window as any).__weatherNeighbor = document.querySelector(selector);
    }, `${b} [data-testid="weather-application"]`);
    await click('instances-toggle');
    expect(await page.$(`${a} [data-testid="weather-application"]`)).toBeNull();
    await click('instances-toggle');
    await page.waitForSelector(
      `${a} [data-testid="weather-save"]:not(:disabled)`,
    );
    expect(
      await page.$eval(
        `${a} [data-testid="favorite-count"]`,
        node => node.textContent,
      ),
    ).toBe('0');
    expect(
      await page.$eval(
        `${b} [data-testid="favorite-count"]`,
        node => node.textContent,
      ),
    ).toBe('1');
    expect(
      await page.evaluate(() => (window as any).__weatherNeighbor.isConnected),
    ).toBe(true);
    expect(new URL(page.url()).pathname).toBe('/weather-instances');
  });
  it('starts selected memory applications at local entry paths without changing the host URL', async () => {
    const { page, visit } = getContext();
    await visit('route-exports', 'scope-product-list');
    const entry = '[data-testid="app-product-entry"]';
    const location = `${entry} [data-testid="route-remote-location"]`;
    await page.waitForSelector(location);
    expect(await page.$eval(location, node => node.textContent)).toBe(
      '/detail/45?tab=memory#start',
    );
    const hostUrl = page.url();
    await page.click(`${entry} [data-testid="route-remote-next"]`);
    await page.waitForFunction(
      selector =>
        document.querySelector(selector)?.textContent ===
        '/detail/43?tab=remote#forecast',
      {},
      location,
    );
    expect(page.url()).toBe(hostUrl);
    expect(
      await page.$(
        '[data-testid="app-product-a"] [data-testid="scope-product-list"]',
      ),
    ).not.toBeNull();
  });
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
        id
          .replace(/\\/g, '/')
          .includes(`/src/routes/__applications/${route}/page`),
      );
    expect(includesRoute('Weather', 'orders')).toBe(true);
    expect(includesRoute('Weather', 'product')).toBe(true);
    const fullApplication = graphs.Weather.join('\n').replaceAll('\\', '/');
    for (const route of ['current', 'forecast', 'air']) {
      expect(fullApplication).toContain(
        `/src/routes/weather/${route}/page.tsx`,
      );
    }
    expect(includesRoute('Product', 'product')).toBe(true);
    expect(includesRoute('Product', 'orders')).toBe(false);
    expect(includesRoute('Orders', 'orders')).toBe(true);
    expect(includesRoute('Orders', 'product')).toBe(false);
    const application = graphs.WeatherApplication.join('\n').replaceAll(
      '\\',
      '/',
    );
    for (const route of [
      'overview',
      'forecast',
      'forecast/[day]',
      'favorites',
    ]) {
      expect(application).toContain(
        `/src/routes/weather-application/${route}/page.tsx`,
      );
    }
    expect(application).toContain('/src/weather-ui.tsx');
    expect(application).toContain('/src/weather-cards.tsx');
    expect(application).toContain('/src/weather-scene.css');
    expect(application).not.toContain('/src/routes/__applications/');
    expect(application).not.toContain('/src/routes/weather/');
    expect(fullApplication).toContain('/src/routes/weather-application/');
    for (const scope of ['Product', 'Orders']) {
      expect(graphs[scope].join('\n').replaceAll('\\', '/')).not.toContain(
        '/src/routes/weather/',
      );
    }
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
