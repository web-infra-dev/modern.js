import type { ChildProcess } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const LOADER_DELAY = 1500;
const NONCE = 'test-nonce';

const files: Record<string, string> = {
  'modern.config.ts': `
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: { mode: 'ppr' } },
  security: { nonce: '${NONCE}' },
});`,
  // The prelude depends on the theme cookie, declared through ppr.vary.
  'src/modern.runtime.ts': `
import { type RuntimePlugin, defineRuntimeConfig } from '@modern-js/runtime';

const themePlugin = (): RuntimePlugin => ({
  name: 'theme-plugin',
  setup: api => {
    api.onBeforeRender(context => {
      const { request, ppr } = (context as any).ssrContext || {};
      const cookieMap = request?.cookieMap ||
        Object.fromEntries(document.cookie.split('; ').map(item => item.split('=')));
      const theme = cookieMap.theme === 'dark' ? 'dark' : 'light';
      (context as any).theme = ppr ? ppr.vary('theme', theme, ['light', 'dark']) : theme;
    });
  },
});

export default defineRuntimeConfig({ plugins: [themePlugin()] });`,
  'src/routes/layout.tsx': `
import { useRuntimeContext } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';
import { useState } from 'react';

export default function Layout() {
  const [count, setCount] = useState(0);
  const { theme } = useRuntimeContext() as { theme?: string };
  return (
    <div>
      <header id="static-header">Static header</header>
      <p id="theme">theme:{theme}</p>
      <button id="counter" onClick={() => setCount(count + 1)}>count:{count}</button>
      <Outlet />
    </div>
  );
}`,
  'src/routes/page.tsx': `
import { useRuntimeContext } from '@modern-js/runtime';
import { Suspense } from 'react';

function CookieReader() {
  const { context } = useRuntimeContext();
  return <div id="cookie">cookie:{context.request.cookieMap?.token || 'none'}</div>;
}

export default function Home() {
  return (
    <main>
      <h1 id="home">Static home</h1>
      <Suspense fallback={<div id="cookie-loading">cookie-loading</div>}>
        <CookieReader />
      </Suspense>
    </main>
  );
}`,
  'src/routes/data/layout.tsx': `
import { Outlet } from '@modern-js/runtime/router';

export default function DataLayout() {
  return <section><Outlet /></section>;
}`,
  'src/routes/data/loading.tsx': `
export default function Loading() {
  return <div id="data-loading">data-loading</div>;
}`,
  'src/routes/data/page.data.ts': `
export const loader = async () => {
  await new Promise(resolve => setTimeout(resolve, ${LOADER_DELAY}));
  return { message: 'loader message' };
};`,
  'src/routes/data/page.tsx': `
import { useLoaderData } from '@modern-js/runtime/router';

export default function DataPage() {
  const data = useLoaderData() as { message: string };
  return <div id="data">{data.message}</div>;
}`,
  'src/routes/defer/page.data.ts': `
import { defer } from '@modern-js/runtime/router';

export const loader = () =>
  defer({
    later: new Promise<string>(resolve => setTimeout(() => resolve('deferred value'), 300)),
  });`,
  'src/routes/defer/page.tsx': `
import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export default function DeferPage() {
  const data = useLoaderData() as { later: Promise<string> };
  return (
    <Suspense fallback={<div id="defer-loading">defer-loading</div>}>
      <Await resolve={data.later}>{(value: string) => <div id="defer">{value}</div>}</Await>
    </Suspense>
  );
}`,
  'src/routes/redirect/page.data.ts': `
import { redirect } from '@modern-js/runtime/router';

export const loader = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return redirect('/data');
};`,
  'src/routes/redirect/page.tsx': `
export default function RedirectPage() {
  return <div id="redirect">should not render</div>;
}`,
  'src/routes/error/page.data.ts': `
export const loader = async () => {
  throw new Error('loader failed');
};`,
  'src/routes/error/error.tsx': `
export default function ErrorBoundary() {
  return <div id="error-boundary">error boundary</div>;
}`,
  'src/routes/error/page.tsx': `
export default function ErrorPage() {
  return <div id="error-page">should not render</div>;
}`,
  'src/routes/user/[id]/page.data.ts': `
import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = ({ params }: LoaderFunctionArgs) => ({ id: params.id });`,
  'src/routes/user/[id]/page.tsx': `
import { useLoaderData } from '@modern-js/runtime/router';

export default function UserPage() {
  const data = useLoaderData() as { id: string };
  return <div id="user">user:{data.id}</div>;
}`,
};

/** Receives the response body chunk by chunk with their arrival times. */
function fetchChunks(url: string, headers: Record<string, string> = {}) {
  return new Promise<{ chunks: { at: number; text: string }[]; html: string }>(
    (resolve, reject) => {
      const start = Date.now();
      const chunks: { at: number; text: string }[] = [];
      http
        .get(url, { headers }, res => {
          res.setEncoding('utf8');
          res.on('data', text => chunks.push({ at: Date.now() - start, text }));
          res.on('end', () =>
            resolve({ chunks, html: chunks.map(c => c.text).join('') }),
          );
        })
        .on('error', reject);
    },
  );
}

async function openPage(browser: Browser, url: string) {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto(url, { waitUntil: ['networkidle0'] });
  return { page, errors };
}

async function expectInteractive(page: Page) {
  await page.click('#counter');
  await page.waitForFunction(
    () => document.querySelector('#counter')?.textContent === 'count:1',
  );
}

describe('partial prerendering', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let browser: Browser | undefined;
  let origin: string;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(
      path.resolve(__dirname, '../fixtures/streaming'),
      { exclude: ['src', 'modern.config.ts'] },
    );
    for (const [file, content] of Object.entries(files)) {
      const target = path.join(fixture.appDir, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }
    const result = await modernBuild(fixture.appDir);
    expect(result.code, `${result.stdout}\n${result.stderr}`).toBe(0);
    const port = await getPort();
    origin = `http://localhost:${port}`;
    app = await modernServe(fixture.appDir, port);
    browser = await puppeteer.launch({ ...launchOptions, headless: true });
  }, 180000);

  afterAll(async () => {
    try {
      await browser?.close();
    } finally {
      try {
        if (app) await killApp(app);
      } finally {
        await fixture?.cleanup();
      }
    }
  });

  it('prerenders the static pathnames at build time', async () => {
    const manifest = JSON.parse(
      await readFile(
        path.join(fixture.appDir, 'dist/ppr-manifest.json'),
        'utf8',
      ),
    );
    const [artifacts] = Object.values(manifest.entries) as {
      pathname: string;
      prelude: string;
    }[][];
    const pathnames = artifacts
      .map((artifact: { pathname: string }) => artifact.pathname)
      .sort();
    // One prelude per theme.
    expect(pathnames).toEqual([
      '/',
      '/',
      '/data',
      '/data',
      '/defer',
      '/defer',
      '/error',
      '/error',
      '/redirect',
      '/redirect',
    ]);
    const home = artifacts.find(
      artifact =>
        artifact.pathname === '/' &&
        (artifact as unknown as { variant: Record<string, string> }).variant
          .theme === 'dark',
    )!;
    expect(home.prelude).toContain('theme:<!-- -->dark');
    expect(home.prelude).toContain('Static home');
    // Request data is not part of the prelude.
    expect(home.prelude).toContain('cookie-loading');
    expect(home.prelude).not.toContain('cookie:');
  });

  it('sends the prelude before the loaders finish', async () => {
    const { chunks, html } = await fetchChunks(`${origin}/data`);
    const early = chunks
      .filter(chunk => chunk.at < LOADER_DELAY - 500)
      .map(chunk => chunk.text)
      .join('');
    expect(early).toContain('Static header');
    expect(early).toContain('data-loading');
    expect(early).not.toContain('loader message');
    expect(html).toContain('loader message');
    expect(html).toContain('"mode":"ppr"');
    expect(html).not.toContain('SHELL_STREAM_END');
  });

  it('hydrates the resumed loader data', async () => {
    const { page, errors } = await openPage(browser!, `${origin}/data`);
    await page.waitForSelector('#data');
    expect(await page.$eval('#data', el => el.textContent)).toBe(
      'loader message',
    );
    expect(await page.$('#data-loading')).toBeNull();
    await expectInteractive(page);
    expect(errors).toEqual([]);
    await page.close();
  });

  it('serves the prelude of the variant the request resolves to', async () => {
    for (const theme of ['light', 'dark']) {
      const { chunks } = await fetchChunks(`${origin}/data`, {
        cookie: `theme=${theme}`,
      });
      const early = chunks
        .filter(chunk => chunk.at < LOADER_DELAY - 500)
        .map(chunk => chunk.text)
        .join('');
      expect(early).toContain(`theme:<!-- -->${theme}`);
    }
  });

  it('lets the client render the error boundary when a loader throws', async () => {
    const { html } = await fetchChunks(`${origin}/error`);
    expect(html).toContain('"renderLevel":0');
    expect(html).not.toContain('should not render');
    const { page } = await openPage(browser!, `${origin}/error`);
    await page.waitForSelector('#error-boundary');
    expect(await page.$eval('#error-boundary', el => el.textContent)).toBe(
      'error boundary',
    );
    await expectInteractive(page);
    await page.close();
  });

  it('renders request data at request time', async () => {
    const { html } = await fetchChunks(`${origin}/`, {
      cookie: 'token=abc',
    });
    expect(html).toContain('cookie:<!-- -->abc');

    const page = await browser!.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setCookie({ name: 'token', value: 'abc', url: origin });
    await page.goto(`${origin}/`, { waitUntil: ['networkidle0'] });
    expect(await page.$eval('#cookie', el => el.textContent)).toBe(
      'cookie:abc',
    );
    await expectInteractive(page);
    expect(errors).toEqual([]);
    await page.close();
  });

  it('streams deferred loader data', async () => {
    const { page, errors } = await openPage(browser!, `${origin}/defer`);
    await page.waitForSelector('#defer');
    expect(await page.$eval('#defer', el => el.textContent)).toBe(
      'deferred value',
    );
    await expectInteractive(page);
    expect(errors).toEqual([]);
    await page.close();
  });

  it('redirects on the client when a loader redirects after the prelude', async () => {
    const { html } = await fetchChunks(`${origin}/redirect`);
    expect(html).toContain('location.replace("/data")');
    expect(html).not.toContain('should not render');

    const { page } = await openPage(browser!, `${origin}/redirect`);
    await page.waitForSelector('#data');
    expect(new URL(page.url()).pathname).toBe('/data');
    await page.close();
  });

  it('streams pathnames that were not prerendered', async () => {
    const { html } = await fetchChunks(`${origin}/user/1`);
    expect(html).toContain('user:<!-- -->1');
    const { page, errors } = await openPage(browser!, `${origin}/user/1`);
    expect(await page.$eval('#user', el => el.textContent)).toBe('user:1');
    await expectInteractive(page);
    expect(errors).toEqual([]);
    await page.close();
  });

  it('sets the request nonce on every inline script', async () => {
    for (const pathname of ['/', '/data', '/defer']) {
      const { html } = await fetchChunks(`${origin}${pathname}`);
      expect(html).not.toContain('__MODERN_PPR_NONCE__');
      const inlineScripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) || [];
      expect(inlineScripts.length).toBeGreaterThan(0);
      for (const tag of inlineScripts) {
        if (tag.includes('application/json')) continue;
        expect(tag).toContain(`nonce="${NONCE}"`);
      }
    }
  });

  it('ignores the prerender header on a production server', async () => {
    const { html } = await fetchChunks(`${origin}/`, {
      'x-modern-ppr-prerender': '1',
    });
    expect(html).toContain('Static home');
    expect(html.trim().startsWith('{')).toBe(false);
  });
});
