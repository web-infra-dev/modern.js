import type { ChildProcess } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');
const browserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

describe.each(['string', 'stream'] as const)(
  'Head isolation (%s SSR)',
  mode => {
    let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
    let app: ChildProcess | undefined;
    let origin: string;

    beforeAll(async () => {
      fixture = await createIsolatedTestApp(fixtureDir);
      // Let the generated entry select renderString/renderStreaming from config.
      await rm(path.join(fixture.appDir, 'src/entry.server.tsx'));
      await writeFile(
        path.join(fixture.appDir, 'modern.config.ts'),
        `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({ server: { ssr: { mode: '${mode}' } } });
`,
      );
      const port = await getPort();
      origin = `http://127.0.0.1:${port}`;
      const build = await modernBuild(fixture.appDir);
      expect(build.code, build.stderr || build.stdout).toBe(0);
      app = await modernServe(fixture.appDir, port);
    });

    afterAll(async () => {
      try {
        if (app) await killApp(app);
      } finally {
        await fixture?.cleanup();
      }
    });

    test('returns only each concurrent request’s head in raw HTML', async () => {
      const names = ['en', 'fr', 'ja', 'de', 'es', 'it', 'pt', 'ko'];
      const results = await Promise.all(
        names.map(async name => {
          const response = await fetch(
            `${origin}/head/${name}${mode === 'stream' ? '?deferred=1' : ''}`,
            {
              headers: {
                'user-agent': browserAgent,
                'x-should-stream-all': 'true',
              },
            },
          );
          expect(response.status).toBe(200);
          return { name, html: await response.text() };
        }),
      );
      for (const { name, html } of results) {
        const head = html.slice(0, html.indexOf('</head>'));
        expect(html).toContain(`lang="${name}"`);
        expect(html).toContain(`data-head-page="${name}"`);
        expect(head).toContain(`Head ${name}</title>`);
        expect(head).toContain(`href="https://example.com/${name}"`);
        expect(head).toContain(`{"name":"${name}"}`);
        for (const other of names.filter(value => value !== name)) {
          expect(head).not.toContain(`href="https://example.com/${other}"`);
          expect(head).not.toContain(`{"name":"${other}"}`);
        }
      }
    });

    test('takes over SSR tags once and updates head after same-document navigation', async () => {
      const browser = await puppeteer.launch(launchOptions);
      try {
        const page = await browser.newPage();
        const errors: string[] = [];
        page.on('pageerror', error => {
          errors.push(String(error));
        });
        await page.goto(`${origin}/head/en`, { waitUntil: 'networkidle0' });
        await page.waitForFunction(
          () =>
            document.title === 'Head en' &&
            document.head.querySelectorAll('link[rel="canonical"]').length ===
              1,
        );
        await page.evaluate(() => {
          document.body.dataset.sameDocument = 'true';
        });
        await page.click('#head-next');
        await page.waitForFunction(
          () =>
            document.title === 'Head fr' &&
            document.documentElement.lang === 'fr',
        );
        const state = await page.evaluate(() => ({
          sameDocument: document.body.dataset.sameDocument,
          bodyPage: document.body.dataset.headPage,
          titles: document.head.querySelectorAll('title').length,
          descriptions: [
            ...document.head.querySelectorAll('meta[name="description"]'),
          ].map(el => el.getAttribute('content')),
          canonicals: [
            ...document.head.querySelectorAll('link[rel="canonical"]'),
          ].map(el => el.getAttribute('href')),
          data: [
            ...document.head.querySelectorAll(
              'script[type="application/ld+json"]',
            ),
          ].map(el => el.textContent),
        }));
        expect(state).toEqual({
          sameDocument: 'true',
          bodyPage: 'fr',
          titles: 1,
          descriptions: ['Description fr'],
          canonicals: ['https://example.com/fr'],
          data: ['{"name":"fr"}'],
        });
        expect(errors).toEqual([]);
      } finally {
        await browser.close();
      }
    });
  },
);
