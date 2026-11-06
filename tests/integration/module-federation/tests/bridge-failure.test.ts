import { describeLab } from './fixture';

const route = '/bridge-failure';

describeLab('Bridge application SSR failure recovery', getContext => {
  it('reports a failed application stream in the response and recovers through a real CSR document', async () => {
    const { lab, page } = getContext();
    const response = await fetch(`${lab.url}${route}`);
    expect(response.status).toBe(200);
    const body = await response.text();
    const frames = [
      ...body.matchAll(
        /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
      ),
    ].map(
      match =>
        JSON.parse(match[1]) as [string, { type: string; message?: string }],
    );
    const failures = frames.filter(([, frame]) => frame.type === 'error');
    expect(failures).toHaveLength(1);
    expect(failures[0][1]).toEqual({
      type: 'error',
      message: 'Bridge server rendering failed',
    });
    // Error frames expose a stable public message. The original exception is
    // reported through Modern's request diagnostics on the server.
    expect(body).not.toContain('LAB_BRIDGE_SSR_FAILURE');
    await expect
      .poll(() => [...lab.logs.values()].join('\n'), { timeout: 5000 })
      .toContain('LAB_BRIDGE_SSR_FAILURE');
    expect(body).not.toContain('data-testid="scope-product-list"');
    expect(frames.some(([, frame]) => frame.type === 'done')).toBe(false);

    const documents: string[] = [];
    page.on('request', request => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documents.push(request.url());
    });
    // An early error frame can replace the document before its first
    // DOMContentLoaded. Only that navigation cancellation is expected here.
    await page
      .goto(`${lab.url}${route}`, { waitUntil: 'domcontentloaded' })
      .catch(error => {
        if (!String(error).includes('net::ERR_ABORTED')) throw error;
      });
    await page.waitForFunction(
      () => new URL(location.href).searchParams.get('csr') === '1',
    );
    const app = '[data-testid="bridge-recovered-app"]';
    const counter = `${app} [data-testid="scope-count"]`;
    await page.waitForSelector(`${app} [data-testid="scope-product-list"]`);
    await page.waitForFunction(
      selector =>
        document
          .querySelector(selector)
          ?.textContent?.includes('Recovered Bridge station'),
      {},
      app,
    );
    expect(documents.map(url => new URL(url).searchParams.get('csr'))).toEqual([
      null,
      '1',
    ]);
    expect(await page.$('#mf-bridge-fatal-error')).toBeNull();
    await page.click(counter);
    await page.waitForFunction(
      selector =>
        document.querySelector(selector)?.textContent === 'Observations: 1',
      {},
      counter,
    );
    await page.click('[data-testid="bridge-recovery-rename"]');
    await page.waitForFunction(
      selector =>
        document
          .querySelector(selector)
          ?.textContent?.includes('Updated recovered station'),
      {},
      app,
    );
    expect(await page.$eval(counter, element => element.textContent)).toBe(
      'Observations: 1',
    );
  });
});
