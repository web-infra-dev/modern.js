import { describeLab } from './fixture';

const names = [
  'alias',
  'mf-loader',
  'namespace',
  'async-namespace',
  'default',
  'async-default',
];
const instances = names.flatMap(name => [
  `factory-${name}`,
  `declarative-${name}`,
]);

describeLab('Remote input forms', getContext => {
  let hydrationErrors: string[];
  beforeEach(() => {
    hydrationErrors = [];
    getContext().page.on('console', message => {
      const text = message.text();
      if (
        message.type() === 'error' &&
        /Hydration failed|A tree hydrated|error (?:occurred )?(?:during|while) hydrat|(?:Text content|Prop .*) did not match|Minified React error #(418|423|425)/i.test(
          text,
        )
      )
        hydrationErrors.push(text);
    });
  });
  afterEach(() => {
    expect(hydrationErrors).toEqual([]);
  });
  it('renders every Node-loadable input in SSR and leaves noSSR and Bridge instances as placeholders', async () => {
    const { lab } = getContext();
    const response = await fetch(`${lab.url}/input-forms`);
    expect(response.status).toBe(200);
    const html = await response.text();
    for (const instance of instances)
      expect(html).toContain(`data-testid="input-${instance}"`);
    expect(html).toContain('Lakeside inputs');
    for (const id of [
      'input-preloaded-forecast',
      'input-preloaded-forecast-module',
    ]) {
      const article = html.match(
        new RegExp(`<article[^>]*data-testid="${id}"[\\s\\S]*?</article>`),
      )?.[0];
      expect(article).toBeDefined();
      expect(article).toContain('modern-server');
      expect(article).not.toContain('Live from the remote build');
    }
    expect(html).toContain('data-testid="input-no-ssr-placeholder"');
    expect(html).toContain(
      'data-testid="input-declarative-no-ssr-placeholder"',
    );
    expect(html).not.toContain('data-testid="input-factory-no-ssr"');
    expect(html).not.toContain('data-testid="input-declarative-no-ssr"');
    expect(html).not.toContain('CLIENT_LOADER_EXECUTED_ON_SERVER');
    expect(html).toContain('data-mf-bridge');
    expect(html).toContain('Waiting for independent station');
    expect(html).not.toContain('Observations saved:');
  });

  it.each(['', '?csr=1'])(
    'keeps input-form component state and props after %s rendering',
    async query => {
      const { lab, page, visit, click } = getContext();
      if (query) {
        const html = await (
          await fetch(`${lab.url}/input-forms${query}`)
        ).text();
        for (const instance of instances)
          expect(html).not.toContain(`data-testid="input-${instance}"`);
      }
      await visit(`input-forms${query}`, 'input-factory-alias');
      await page.waitForSelector('html[data-input-forms-ready="true"]');
      await page.waitForFunction(() =>
        ['input-preloaded-forecast', 'input-preloaded-forecast-module'].every(
          id =>
            document.querySelector(
              `[data-testid="${id}"] [data-testid="data-source"]`,
            )?.textContent === 'modern-server',
        ),
      );
      for (const instance of [
        ...instances,
        'factory-no-ssr',
        'declarative-no-ssr',
      ]) {
        await page.waitForSelector(`[data-testid="input-${instance}-count"]`);
        await click(`input-${instance}-count`);
      }
      await click('input-rename');
      await page.waitForFunction(
        expected =>
          expected.every(instance => {
            const element = document.querySelector(
              `[data-testid="input-${instance}"]`,
            );
            return (
              element?.textContent?.includes('Hilltop inputs') &&
              element.textContent.includes('Readings: 1')
            );
          }),
        {},
        [...instances, 'factory-no-ssr', 'declarative-no-ssr'],
      );
    },
  );

  it('keeps Bridge loader and literal instances independent and preserves their state on prop updates', async () => {
    const { page, visit, click } = getContext();
    await visit('input-forms', 'input-bridge-factory');
    for (const api of ['factory', 'declarative']) {
      await page.waitForSelector(
        `[data-testid="input-bridge-${api}"] [data-testid="station-observation"]`,
      );
      await page.click(
        `[data-testid="input-bridge-${api}"] [data-testid="station-observation"]`,
      );
    }
    await click('input-rename');
    await page.waitForFunction(() =>
      ['factory', 'declarative'].every(api => {
        const element = document.querySelector(
          `[data-testid="input-bridge-${api}"]`,
        );
        return (
          element?.textContent?.includes('Hilltop inputs') &&
          element.textContent.includes('Observations saved: 1')
        );
      }),
    );
  });

  it('retries failed function sources through both APIs while preserving a neighboring component', async () => {
    const { page, visit, click } = getContext();
    await visit('input-forms', 'input-factory-alias');
    await page.waitForSelector('html[data-input-forms-ready="true"]');
    await page.waitForFunction(() =>
      ['input-preloaded-forecast', 'input-preloaded-forecast-module'].every(
        id =>
          document.querySelector(
            `[data-testid="${id}"] [data-testid="data-source"]`,
          )?.textContent === 'modern-server',
      ),
    );
    await click('input-factory-alias-count');
    await click('input-show-retry');
    for (const api of ['factory', 'declarative']) {
      await page.waitForSelector(`[data-testid="input-retry-${api}"]`);
      expect(
        await page.$eval(
          `[data-testid="input-retry-${api}"]`,
          element => element.textContent,
        ),
      ).toContain('INPUT_SOURCE_FAILED_ONCE');
      await click(`input-retry-${api}`);
      await page.waitForSelector(`[data-testid="input-${api}-retried-count"]`);
      await click(`input-${api}-retried-count`);
    }
    await click('input-rename');
    await page.waitForFunction(() =>
      ['factory-alias', 'factory-retried', 'declarative-retried'].every(
        instance => {
          const element = document.querySelector(
            `[data-testid="input-${instance}"]`,
          );
          return (
            element?.textContent?.includes('Hilltop inputs') &&
            element.textContent.includes('Readings: 1')
          );
        },
      ),
    );
  });
});
