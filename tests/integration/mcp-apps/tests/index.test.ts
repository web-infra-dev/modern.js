import path from 'node:path';
import { readFile } from 'node:fs/promises';
import puppeteer, { type Browser, type Page } from 'puppeteer';
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
  expect(response.status).toBe(200);
  const text = await response.text();
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

describe('manifest-based MCP Apps', () => {
  let app: unknown;
  let port: number;
  let browser: Browser;
  let page: Page;
  afterEach(async () => {
    if (app) {
      await killApp(app);
      app = undefined;
    }
  });
  afterAll(async () => {
    await browser?.close();
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
    expect(manifest.views.local.html).toMatch(/^\.\/ui\//);
    expect(manifest.views.todos).toMatchObject({
      remote: 'mcp_ui',
      expose: './Todos',
    });
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
    for (const name of ['local', 'todos']) {
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

  it('renders local and MF components with hooks in the development Inspector', async () => {
    port = await getPort();
    app = await launchApp(appDir, port);
    browser = await puppeteer.launch({
      ...launchOptions,
      args: launchOptions.args.filter(
        (arg: string) => arg !== '--disable-web-security',
      ),
    } as any);
    page = await browser.newPage();
    page.on('console', message => {
      if (message.type() === 'error') console.error('Browser:', message.text());
    });
    page.on('pageerror', error => console.error('Page error:', error.message));
    page.on('requestfailed', request =>
      console.error(
        'Request failed:',
        request.url(),
        request.failure()?.errorText,
      ),
    );
    await page.goto(`http://localhost:${port}/mcp/inspector`);
    await page.waitForSelector('.connection .primary');
    await page.click('.connection .primary');
    await page.waitForFunction(
      () => document.querySelectorAll('button.tool').length === 3,
    );
    for (const toolName of ['list_todos', 'local_todos', 'list_todos']) {
      await page.evaluate(name => {
        const button = Array.from(
          document.querySelectorAll<HTMLButtonElement>('button.tool'),
        ).find(button => button.querySelector('strong')?.textContent === name);
        button?.click();
      }, toolName);
      await page.waitForFunction(
        () =>
          !document.querySelector<HTMLButtonElement>('.actions .primary')
            ?.disabled,
      );
      const previousFrameUrl = await page.$eval(
        '.canvas',
        canvas => canvas.querySelector('iframe')?.src ?? '',
      );
      await page.click('.actions .primary');
      await page.waitForFunction(
        (previous: string) => {
          const iframe =
            document.querySelector<HTMLIFrameElement>('.canvas iframe');
          return iframe && iframe.src !== previous;
        },
        {},
        previousFrameUrl,
      );
      const currentFrameUrl = await page.$eval(
        '.canvas iframe',
        iframe => (iframe as HTMLIFrameElement).src,
      );
      // Only inspect the current sandbox, never a previous card's retiring frame.
      const waitForCard = async () => {
        for (const frame of page.frames()) {
          if (frame.parentFrame()?.url() !== currentFrameUrl) continue;
          try {
            const input = await frame.$('input[aria-label="Todo title"]');
            if (input) return frame;
          } catch (error) {
            if (!/context was destroyed|detached/i.test(String(error)))
              throw error;
          }
        }
        return undefined;
      };
      let frame;
      for (let attempt = 0; attempt < 100 && !frame; attempt++) {
        frame = await waitForCard();
        if (!frame) await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!frame) {
        for (const current of page.frames())
          console.error(
            'Card frame:',
            toolName,
            current.url(),
            await current
              .evaluate(() =>
                JSON.stringify({
                  body: document.body.innerText.slice(-600),
                  root: document.getElementById('root')?.innerHTML,
                  ready: document.readyState,
                  resources: performance
                    .getEntriesByType('resource')
                    .map(item => item.name),
                }),
              )
              .catch(() => 'Frame navigated'),
          );
      }
      expect(frame).toBeDefined();
      await frame!.type(
        'input[aria-label="Todo title"]',
        `Todo from ${toolName}`,
      );
      await frame!.click('button[type="submit"]');
      await frame!.waitForFunction(
        (text: string) =>
          document.querySelector('ul')?.textContent?.includes(text),
        { timeout: 10000 },
        `Todo from ${toolName}`,
      );
    }
    await page.close();
  });
});
