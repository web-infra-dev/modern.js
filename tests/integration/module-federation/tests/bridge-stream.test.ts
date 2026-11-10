import { describeLab } from './fixture';

function bridgeFrames(html: string) {
  return [
    ...html.matchAll(
      /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
    ),
  ].map(
    match =>
      JSON.parse(match[1]) as [
        string,
        { type: string; html?: string; snapshot?: unknown },
      ],
  );
}

describeLab('Full and selected Bridge applications', getContext => {
  it('renders full and selected applications and the consumer basename in the response', async () => {
    const { lab } = getContext();
    const full = bridgeFrames(
      await (await fetch(`${lab.url}/route-exports`)).text(),
    );
    expect(full.filter(([, frame]) => frame.type === 'done')).toHaveLength(5);
    const deep = bridgeFrames(
      await (
        await fetch(`${lab.url}/stores/100/inventory/detail/42?tab=stock`)
      ).text(),
    );
    const html = deep
      .filter(([, frame]) => frame.type === 'html')
      .map(([, frame]) => frame.html)
      .join('')
      // React separates adjacent text expressions with empty HTML comments.
      .replaceAll('<!-- -->', '');
    expect(html).toContain('Weather station 42');
    expect(html).toContain('/detail/42?tab=stock');
    expect(html).not.toContain('/product/detail/42');
    expect(deep.some(([, frame]) => frame.type === 'error')).toBe(false);
  });
});

describeLab('Independent progressive Bridge roots', getContext => {
  it('cancels the remote loader when the HTTP consumer disconnects', async () => {
    const { lab } = getContext();
    const probe = `disconnect-${Date.now()}`;
    const abort = new AbortController();
    const response = await fetch(`${lab.url}/bridge-stream?probe=${probe}`, {
      signal: abort.signal,
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let body = '';
    try {
      while (!body.includes('Pending detail')) {
        const chunk = await reader.read();
        if (chunk.done)
          throw new Error('Response ended before the pending remote shell');
        body += decoder.decode(chunk.value, { stream: true });
      }
      const pending = reader.read();
      abort.abort();
      await pending.catch(() => {});
      const deadline = Date.now() + 5000;
      while (
        !lab.bridgeRequests.some(
          item => item.probe === `${probe}-slow` && item.aborted,
        ) &&
        Date.now() < deadline
      ) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(
        lab.bridgeRequests.filter(item => item.probe === `${probe}-slow`),
      ).toEqual([{ probe: `${probe}-slow`, completed: false, aborted: true }]);
    } finally {
      abort.abort();
      lab.releaseBridge(`${probe}-slow`);
    }
  });
  it('hydrates and updates one root while another stream is pending, then restores deferred data without fetching again', async () => {
    const { lab, page } = getContext();
    const probe = `progressive-${Date.now()}`;
    const navigation = page.goto(`${lab.url}/bridge-stream?probe=${probe}`, {
      waitUntil: 'domcontentloaded',
    });
    const count =
      '[data-testid="bridge-fast"] [data-testid="bridge-progressive-count"]';
    try {
      await page.waitForSelector(
        '[data-testid="bridge-fast"] [data-testid="bridge-resolved-detail"]',
      );
      await page.waitForSelector(
        '[data-testid="bridge-slow"] [data-testid="bridge-pending-detail"]',
      );
      await page.waitForSelector(`${count}:not(:disabled)`);
      await page.click(count);
      await page.waitForFunction(
        selector =>
          document.querySelector(selector)?.textContent === 'Count: 1',
        {},
        count,
      );
      await page.evaluate(() => {
        (window as any).__fastBridgeNode = document.querySelector(
          '[data-testid="bridge-fast"] [data-testid="scope-root"]',
        );
      });
      await page.click('[data-testid="stream-rename"]');
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="bridge-slow"]')
          ?.textContent?.includes('Updated streaming station'),
      );
      expect(
        lab.bridgeRequests.filter(item => item.probe === `${probe}-slow`),
      ).toEqual([{ probe: `${probe}-slow`, completed: false, aborted: false }]);
      lab.releaseBridge(`${probe}-slow`);
      await navigation;
      await page.waitForSelector(
        '[data-testid="bridge-slow"] [data-testid="bridge-resolved-detail"]',
      );
      expect(await page.$eval(count, node => node.textContent)).toBe(
        'Count: 1',
      );
      expect(
        await page.evaluate(
          () =>
            (window as any).__fastBridgeNode ===
            document.querySelector(
              '[data-testid="bridge-fast"] [data-testid="scope-root"]',
            ),
        ),
      ).toBe(true);
      expect(
        lab.bridgeRequests.filter(item => item.probe.startsWith(probe)),
      ).toHaveLength(2);
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
    } finally {
      lab.releaseBridge(`${probe}-slow`);
      await navigation;
    }
  });

  it('ignores late stream messages after a pending browser instance is unmounted', async () => {
    const { lab, page } = getContext();
    const probe = `unmount-${Date.now()}`;
    const navigation = page.goto(`${lab.url}/bridge-stream?probe=${probe}`, {
      waitUntil: 'domcontentloaded',
    });
    try {
      await page.waitForSelector(
        '[data-testid="bridge-slow"] [data-testid="bridge-pending-detail"]',
      );
      await page.waitForSelector(
        '[data-testid="bridge-fast"] [data-testid="bridge-resolved-detail"]',
      );
      await page.waitForSelector(
        '[data-testid="bridge-fast"] [data-testid="bridge-progressive-count"]:not(:disabled)',
      );
      await page.click('[data-testid="stream-unmount"]');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="bridge-slow"]')?.children
            .length === 0,
      );
      lab.releaseBridge(`${probe}-slow`);
      await navigation;
      expect(
        await page.$eval(
          '[data-testid="bridge-slow"]',
          node => node.children.length,
        ),
      ).toBe(0);
      expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
    } finally {
      lab.releaseBridge(`${probe}-slow`);
      await navigation;
    }
  });
});
