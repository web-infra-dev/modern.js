import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describeLab } from './fixture';

describeLab('Rendering and assets', getContext => {
  it('renders a static remote in HTML, hydrates it and loads its styles', async () => {
    const { lab, page, visit, counter, selector } = getContext();
    const html = await (await fetch(`${lab.url}/static`)).text();
    expect(html).toContain('A signal from another origin.');
    await visit('static', 'signal');
    await counter('signal');
    await page.waitForFunction(
      () =>
        (
          document.querySelector(
            '[data-testid="signal-image"]',
          ) as HTMLImageElement
        )?.naturalWidth > 0,
    );
    expect(
      await page.$eval(
        selector('signal-image'),
        image => new URL((image as HTMLImageElement).src).port,
      ),
    ).toBe(String(lab.ports.provider));
    expect(
      await page.$eval(
        selector('signal'),
        element => getComputedStyle(element).backgroundColor,
      ),
    ).toBe('rgb(215, 242, 237)');
  });
  it('renders a dynamically registered Rslib remote in HTML and hydrates it', async () => {
    const { lab, page, visit, counter, selector } = getContext();
    const html = await (await fetch(`${lab.url}/dynamic`)).text();
    expect(html).toContain('A different build. The same connection.');
    await visit('dynamic', 'library-signal');
    await counter('library-signal');
    expect(
      await page.$eval(
        selector('library-signal'),
        element => getComputedStyle(element).backgroundColor,
      ),
    ).toBe('rgb(233, 229, 250)');
  });
  it('renders and hydrates a remote through an independent nested build', async () => {
    const { lab, visit, counter, relayTools } = getContext();
    expect(await (await fetch(`${lab.url}/nested`)).text()).toContain(
      'A signal from another origin.',
    );
    await visit('nested', 'nested-signal');
    await counter('nested-signal');
    await relayTools();
  });
  it('loads a dynamically nested remote with its styles and interactions', async () => {
    const { lab, page, visit, counter, relayTools, selector } = getContext();
    expect(await (await fetch(`${lab.url}/dynamic-nested`)).text()).toContain(
      'A different build. The same connection.',
    );
    await visit('dynamic-nested', 'dynamic-nested-signal');
    await counter('dynamic-nested-signal');
    await relayTools();
    expect(
      await page.$eval(
        selector('dynamic-nested-signal'),
        element => getComputedStyle(element).backgroundColor,
      ),
    ).toBe('rgb(233, 229, 250)');
  });
  it('keeps remote components interactive across client navigation and history', async () => {
    const { page, visit, counter, selector } = getContext();
    await visit('static', 'signal');
    await page.evaluate(() => {
      (window as any).navigationSentinel = 'preserved';
    });
    await page.click('a[href="/nested"]');
    await page.waitForSelector(selector('nested-signal'));
    await page.goBack();
    await page.waitForSelector(selector('signal'));
    await counter('signal');
    await page.goForward();
    await page.waitForSelector(selector('nested-signal'));
    expect(await page.evaluate(() => (window as any).navigationSentinel)).toBe(
      'preserved',
    );
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
    const url = new URL(
      `${server.path || ''}${server.name}`,
      manifest.metaData.ssrPublicPath,
    );
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('lab_provider');
  });
  if (getContext().mode === 'dev')
    it('revalidates an updated remote in development without stale server HTML', async () => {
      const { lab, workspace } = getContext();
      const source = path.join(workspace, 'provider/src/components/Signal.tsx');
      const original = await readFile(source, 'utf8');
      const marker = 'Updated signal from the remote.';
      expect(original).toContain('A signal from another origin.');
      const before = await (
        await fetch(`${lab.url}/static`, { signal: AbortSignal.timeout(10000) })
      ).text();
      expect(before).toContain('A signal from another origin.');
      try {
        await writeFile(
          source,
          original.replace('A signal from another origin.', marker),
        );
        await expect
          .poll(
            async () => {
              const response = await fetch(`${lab.url}/static`, {
                signal: AbortSignal.timeout(10000),
              });
              return (await response.text()).includes(marker);
            },
            { timeout: 30000 },
          )
          .toBe(true);
      } finally {
        await writeFile(source, original);
        await expect
          .poll(
            async () =>
              (
                await (
                  await fetch(`${lab.url}/static`, {
                    signal: AbortSignal.timeout(10000),
                  })
                ).text()
              ).includes('A signal from another origin.'),
            { timeout: 30000 },
          )
          .toBe(true);
      }
    });
});
