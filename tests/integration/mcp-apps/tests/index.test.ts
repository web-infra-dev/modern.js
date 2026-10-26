import path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '..');
const headers = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};
async function rpc(port: number, method: string, params?: unknown) {
  const response = await fetch(`http://localhost:${port}/api/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const text = await response.text();
  expect(response.status, text).toBe(200);
  const message = JSON.parse(
    text.startsWith('event:')
      ? text
          .split('\n')
          .find(line => line.startsWith('data:'))!
          .slice(5)
      : text,
  );
  expect(message.error).toBeUndefined();
  return message.result;
}

async function mountCard(page: Page, html: string) {
  await page.evaluate(html => {
    document.querySelector('iframe')?.remove();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    window.onmessage = event => {
      if (event.source !== iframe.contentWindow) return;
      const message = event.data;
      if (message.method === 'ui/initialize') {
        iframe.dataset.capabilities = JSON.stringify(
          message.params.appCapabilities,
        );
        iframe.contentWindow!.postMessage(
          {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: message.params.protocolVersion,
              hostInfo: { name: 'integration-test', version: '1' },
              hostCapabilities: {},
              hostContext: { theme: 'light', displayMode: 'inline' },
            },
          },
          '*',
        );
      } else if (message.method === 'ui/notifications/initialized') {
        iframe.contentWindow!.postMessage(
          {
            jsonrpc: '2.0',
            method: 'ui/notifications/tool-result',
            params: { content: [], structuredContent: { todos: [] } },
          },
          '*',
        );
      }
    };
    iframe.srcdoc = html;
    document.body.append(iframe);
  }, html);
  return page.waitForFrame(
    frame =>
      frame.parentFrame() === page.mainFrame() &&
      frame.url() === 'about:srcdoc',
  );
}

describe('manifest-based MCP Apps', () => {
  let app: unknown;
  let port: number;
  let browser: Browser | undefined;
  let originalLabel: string | undefined;
  afterEach(async () => {
    await browser?.close();
    browser = undefined;
    if (app) {
      await killApp(app);
      app = undefined;
    }
    if (originalLabel !== undefined) {
      await writeFile(
        path.join(appDir, 'src/components/local-label.ts'),
        originalLabel,
      );
      originalLabel = undefined;
    }
  });

  it('builds without evaluating server code and serves both kinds of cards in production', async () => {
    const build = await modernBuild(appDir, [], {
      env: { MCP_BUILD_ONLY: '1' },
    });
    expect(build.code).toBe(0);
    expect(build.stdout).not.toContain('TypeScript compilation failed');
    const manifest = JSON.parse(
      await readFile(
        path.join(appDir, 'dist/mcp-apps/ui-manifest.json'),
        'utf8',
      ),
    );
    expect(manifest.views.local.html).toMatch(/^\.\/ui\/mcp-ui-local-/);
    const htmlFiles = await readdir(path.join(appDir, 'dist/html'), {
      recursive: true,
    });
    expect(htmlFiles.some(file => file.includes('mcp-ui-local-'))).toBe(true);
    expect(htmlFiles.some(file => file.includes('inspector'))).toBe(false);
    expect(manifest.views.local.html).not.toBe(manifest.views.localAlt.html);
    for (const name of ['local', 'localAlt']) {
      const html = manifest.views[name].html;
      const entry = path.basename(html, '.html');
      expect(
        await readFile(path.join(appDir, 'dist/mcp-apps', html), 'utf8'),
      ).toBe(
        await readFile(
          path.join(appDir, 'dist/html', entry, 'index.html'),
          'utf8',
        ),
      );
    }
    port = await getPort();
    app = await modernServe(appDir, port);
    const tools = await rpc(port, 'tools/list');
    expect(
      tools.tools.find((tool: { name: string }) => tool.name === 'list_todos')
        ._meta.ui.resourceUri,
    ).toBe('ui://app/todos');
    const result = await rpc(port, 'tools/call', {
      name: 'list_todos',
      arguments: {},
    });
    expect(result.structuredContent).toEqual({ todos: [] });
    expect(result._meta).toBeUndefined();
    for (const name of ['local', 'localAlt', 'todos']) {
      const resource = await rpc(port, 'resources/read', {
        uri: `ui://app/${name}`,
      });
      expect(resource.contents[0].mimeType).toBe('text/html;profile=mcp-app');
      expect(resource.contents[0].text).toContain(
        `<base href="http://localhost:${port}/">`,
      );
      if (name === 'todos')
        expect(resource.contents[0].text).toContain('modern-mcp-config');
    }
  });

  it('boots a local multi-entry card and rebuilds its dependencies', async () => {
    port = await getPort();
    app = await launchApp(appDir, port);
    const initial = await rpc(port, 'resources/read', {
      uri: 'ui://app/local',
    });
    browser = await puppeteer.launch({
      ...launchOptions,
      args: launchOptions.args.filter(
        (arg: string) => arg !== '--disable-web-security',
      ),
    } as any);
    const page = await browser.newPage();
    page.on('pageerror', error => console.error('Page error:', error.message));
    page.on('console', message => {
      if (message.type() === 'error') console.error('Browser:', message.text());
    });
    await page.setCacheEnabled(false);
    // Use a real loopback response to preserve the browser's local address-space
    // classification, then install a minimal test host without application HMR.
    await page.goto(`http://localhost:${port}/static/mf-manifest.json`);
    await page.setContent('<html><body></body></html>');
    const initialFrame = await mountCard(page, initial.contents[0].text);
    await initialFrame
      .waitForFunction(
        () => document.body.textContent?.includes('Local card initial label'),
        { timeout: 15000 },
      )
      .catch(async error => {
        console.error(
          'Frame state:',
          await initialFrame.evaluate(() => ({
            body: document.body.innerHTML.slice(0, 1000),
            resources: performance
              .getEntriesByType('resource')
              .map(r => r.name),
          })),
        );
        throw error;
      });
    expect(
      await page.$eval('iframe', iframe =>
        JSON.parse(iframe.dataset.capabilities!),
      ),
    ).toEqual({
      availableDisplayModes: ['inline'],
      experimental: { fixture: { source: 'local' } },
    });
    const labelPath = path.join(appDir, 'src/components/local-label.ts');
    originalLabel = await readFile(labelPath, 'utf8');
    await writeFile(
      labelPath,
      originalLabel.replace(
        'Local card initial label',
        'Local card updated label',
      ),
    );
    let updated = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      let resource;
      try {
        resource = await rpc(port, 'resources/read', { uri: 'ui://app/local' });
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      const frame = await mountCard(page, resource.contents[0].text);
      await new Promise(resolve => setTimeout(resolve, 500));
      if (
        await frame.evaluate(() =>
          document.body.textContent?.includes('Local card updated label'),
        )
      ) {
        updated = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    expect(updated).toBe(true);
    const currentResource = await rpc(port, 'resources/read', {
      uri: 'ui://app/local',
    });
    const currentPage = await fetch(
      `http://localhost:${port}/mcp-ui-local-25bf8e1a2393`,
    );
    const scripts = (html: string) =>
      Array.from(
        html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
        match => match[1],
      );
    expect(scripts(currentResource.contents[0].text)).toEqual(
      scripts(await currentPage.text()),
    );
    expect(currentResource.contents[0]._meta.ui.csp.connectDomains).toContain(
      `ws://localhost:${port}`,
    );

    const alternate = await rpc(port, 'resources/read', {
      uri: 'ui://app/localAlt',
    });
    const alternateFrame = await mountCard(page, alternate.contents[0].text);
    await alternateFrame.waitForFunction(() =>
      document.body.textContent?.includes('Local card updated label'),
    );

    const manifest = JSON.parse(
      await readFile(
        path.join(appDir, 'node_modules/.modern-js/mcp-apps/ui-manifest.json'),
        'utf8',
      ),
    );
    expect(manifest.views.local.html).toMatch(/^\.\/ui\/mcp-ui-local-/);
    const remote = await rpc(port, 'resources/read', { uri: 'ui://app/todos' });
    expect(remote.contents[0].text).toContain('modern-mcp-config');
    const mfFrame = await mountCard(page, remote.contents[0].text);
    await mfFrame.waitForSelector('input[aria-label="Todo title"]');
    expect(
      await page.$eval('iframe', iframe =>
        JSON.parse(iframe.dataset.capabilities!),
      ),
    ).toEqual({
      availableDisplayModes: ['inline', 'fullscreen'],
      experimental: { fixture: { source: 'mf' } },
    });
  });
});
