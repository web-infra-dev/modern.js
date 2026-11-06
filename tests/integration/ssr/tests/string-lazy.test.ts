import type { ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/base');

// A lazy component is always suspended the first time it renders in a
// process, which is what `renderToString` used to leave for the client.
const lazyPage = `import { Suspense, lazy } from 'react';

const Content = lazy(() => import('./content'));

export default function LazyPage() {
  return (
    <Suspense fallback={<div>lazy loading</div>}>
      <Content />
    </Suspense>
  );
}
`;

const lazyContent = `export default function Content() {
  return <div id="lazy-content">lazy content</div>;
}
`;

// Suspends forever: the render must still finish within the wait limit.
const neverPage = `import { Suspense, lazy } from 'react';

const Never = lazy(() => new Promise(() => {}));

export default function NeverPage() {
  return (
    <Suspense fallback={<div id="never-fallback">never loading</div>}>
      <Never />
    </Suspense>
  );
}
`;

const deferredLoader = `import { defer } from '@modern-js/runtime/router';

export default () =>
  defer({
    slow: new Promise<string>(resolve => setTimeout(() => resolve('slow data'), 2000)),
  });
`;

const deferredPage = `import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export default function DeferredPage() {
  const data = useLoaderData() as { slow: Promise<string> };
  return (
    <Suspense fallback={<div id="deferred-fallback">deferred loading</div>}>
      <Await resolve={data.slow}>{(value: string) => <div>{value}</div>}</Await>
    </Suspense>
  );
}
`;

describe('string SSR with React.lazy', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let browser: Browser | undefined;
  let port: number;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const routeDir = path.join(fixture.appDir, 'src/routes/lazy');
    await mkdir(routeDir, { recursive: true });
    await writeFile(path.join(routeDir, 'page.tsx'), lazyPage);
    await writeFile(path.join(routeDir, 'content.tsx'), lazyContent);
    const neverDir = path.join(fixture.appDir, 'src/routes/never');
    await mkdir(neverDir, { recursive: true });
    await writeFile(path.join(neverDir, 'page.tsx'), neverPage);
    const deferredDir = path.join(fixture.appDir, 'src/routes/deferred');
    await mkdir(deferredDir, { recursive: true });
    await writeFile(path.join(deferredDir, 'page.loader.ts'), deferredLoader);
    await writeFile(path.join(deferredDir, 'page.tsx'), deferredPage);
    const result = await modernBuild(fixture.appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    port = await getPort();
    app = await modernServe(fixture.appDir, port);
    browser = await puppeteer.launch(launchOptions as any);
  });

  afterAll(async () => {
    try {
      await browser?.close();
      if (app) await killApp(app);
    } finally {
      await fixture?.cleanup();
    }
  });

  test('renders the lazy component on the first request of a fresh server', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/lazy`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<div id="lazy-content">lazy content</div>');
    expect(html).not.toContain('<!--$!-->');
    expect(html).not.toContain('lazy loading');
  });

  test('hydrates without recoverable errors', async () => {
    const page = await browser!.newPage();
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${port}/lazy`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('#lazy-content', el => el.textContent);
    expect(text).toBe('lazy content');
    expect(errors.filter(error => /#41[89]|hydrat/i.test(error))).toEqual([]);
    await page.close();
  });

  test('stops waiting for content that never settles', async () => {
    const start = Date.now();
    const response = await fetch(`http://127.0.0.1:${port}/never`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(Date.now() - start).toBeLessThan(6000);
    expect(html).toContain('never loading');
  });

  test('keeps rendering the fallback of deferred loader data', async () => {
    const start = Date.now();
    const response = await fetch(`http://127.0.0.1:${port}/deferred`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(Date.now() - start).toBeLessThan(1500);
    expect(html).toContain('deferred loading');
    expect(html).not.toContain('slow data');
  });
});
