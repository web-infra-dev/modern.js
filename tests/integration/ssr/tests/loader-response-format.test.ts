import type { ChildProcess } from 'node:child_process';
import dns from 'node:dns';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');

const fixtureDir = path.resolve(__dirname, '../fixtures/fallback');

const files: Record<string, string> = {
  // A render middleware answers the data loader request of `/intercepted`
  // with an HTML page, before the data loader handler runs.
  'server/modern.server.ts': `import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const intercept: MiddlewareHandler = async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname === '/intercepted' && url.searchParams.has('__loader')) {
    return c.html('<!doctype html><html><body>intercepted</body></html>');
  }
  await next();
};

export default defineServerConfig({
  renderMiddlewares: [{ name: 'intercept-loader', handler: intercept }],
});
`,
  'src/routes/home/page.tsx': `import { Link } from '@modern-js/runtime/router';

export default function Home() {
  return (
    <div>
      <Link id="to-normal" to="/normal">normal</Link>
      <Link id="to-intercepted" to="/intercepted">intercepted</Link>
    </div>
  );
}
`,
  'src/routes/normal/page.data.ts': `export const loader = () => ({ text: 'from loader' });
`,
  'src/routes/normal/page.tsx': `import { useLoaderData } from '@modern-js/runtime/router';

export default function Normal() {
  const data = useLoaderData() as { text: string };
  return <div id="normal">{data.text}</div>;
}
`,
  'src/routes/intercepted/page.data.ts': `export const loader = () => ({ text: 'from loader' });
`,
  'src/routes/intercepted/page.tsx': `import { useLoaderData } from '@modern-js/runtime/router';

export default function Intercepted() {
  const data = useLoaderData();
  return <div id="intercepted">{typeof data}</div>;
}
`,
};

describe('data loader response format warning (development)', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let appPort: number;
  let browser: Browser;
  let page: Page;
  let warnings: string[];

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    for (const [file, content] of Object.entries(files)) {
      const target = path.join(fixture.appDir, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }
    appPort = await getPort();
    app = await launchApp(fixture.appDir, appPort, {});
    browser = await puppeteer.launch(launchOptions as any);
  });

  afterAll(async () => {
    await browser?.close();
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  beforeEach(async () => {
    warnings = [];
    page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'warn' || msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    await page.goto(`http://localhost:${appPort}/home`, {
      waitUntil: ['networkidle0'],
    });
  });

  afterEach(async () => {
    await page?.close();
  });

  test('does not warn for a normal data loader response', async () => {
    await page.click('#to-normal');
    await page.waitForSelector('#normal');
    const text = await page.$eval('#normal', el => el.textContent);
    expect(text).toBe('from loader');
    expect(warnings.filter(w => w.includes('X-Modernjs-Response'))).toEqual([]);
  });

  test('warns when a middleware answers the data loader request with HTML', async () => {
    await page.click('#to-intercepted');
    await page.waitForSelector('#intercepted');
    // The behavior is unchanged: the HTML text is still passed as loader data.
    const text = await page.$eval('#intercepted', el => el.textContent);
    expect(text).toBe('string');
    const matched = warnings.filter(w => w.includes('X-Modernjs-Response'));
    expect(matched).toHaveLength(1);
    expect(matched[0]).toContain('intercepted/page');
    expect(matched[0]).toContain('text/html');
  });
});
