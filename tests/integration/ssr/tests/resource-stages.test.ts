import type { ChildProcess } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

type Report = {
  declarations: {
    file: string;
    request: string;
    stage: string;
    level: string[];
    chunks: { id: string | number; files: string[] }[];
  }[];
};

const pageSource = `import { Suspense, lazy } from 'react';
import { stagedImport } from '@modern-js/runtime/resources';

const Critical = lazy(stagedImport.critical(() => import('./Critical')));
const loadVisible = stagedImport.visible(() => import('./Visible'));
const loadIdle = stagedImport.idle(() => import('./Idle'));
const loadReply = stagedImport.firstReply(() => import('./Reply'));
const loadMention = stagedImport.interaction(() => import('./Mention'));

export default function Page() {
  return (
    <Suspense fallback="loading">
      <Critical />
      <input id="mention" ref={loadMention.trigger} />
      <button id="load" type="button" onClick={() => Promise.all([loadVisible(), loadIdle(), loadReply()])}>load</button>
    </Suspense>
  );
}
`;

const component = (name: string, css = false) =>
  `${css ? `import './${name}.css';\n` : ''}export default function ${name}() {
  return <div id="${name.toLowerCase()}">${name} component</div>;
}
`;

const writeApp = async (appDir: string, ssr: string) => {
  await writeFile(
    path.join(appDir, 'modern.config.ts'),
    `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: ${ssr} },
  performance: {
    resourceStages: {
      stages: { firstReply: { after: 'interactive', timeout: 500 } },
      idleQuietTime: 300,
    },
  },
});`,
  );
  const dir = path.join(appDir, 'src/routes/stages');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'page.tsx'), pageSource);
  for (const name of ['Critical', 'Idle', 'Reply', 'Mention']) {
    await writeFile(path.join(dir, `${name}.tsx`), component(name));
  }
  await writeFile(path.join(dir, 'Visible.tsx'), component('Visible', true));
  await writeFile(path.join(dir, 'Visible.css'), '#visible { color: red; }');
};

const payloads = (html: string) =>
  [...html.matchAll(/__MODERN_RS__\|\|\[\]\)\.push\((.+?)\)<\/script>/g)].map(
    match => JSON.parse(match[1]),
  );

const preloads = (html: string) =>
  [
    ...html.matchAll(/<link\b[^>]*\brel="preload"[^>]*\bhref="([^"]+)"[^>]*>/g),
  ].map(match => match[1]);

describe.each([
  ['stream', 'true'],
  ['string', `{ mode: 'string' }`],
  ['csr', 'false'],
] as const)('resource stages (%s)', (mode, ssr) => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let port: number;
  let html: string;
  let report: Report;
  let browser: Browser;

  const declaration = (request: string) =>
    report.declarations.find(item => item.request === request)!;
  const jsFiles = (request: string) =>
    declaration(request).chunks.flatMap(chunk =>
      chunk.files.filter(file => file.endsWith('.js')),
    );
  const chunkIds = (request: string) =>
    declaration(request).chunks.map(chunk => String(chunk.id));

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    await writeApp(fixture.appDir, ssr);
    if (mode !== 'stream') {
      await rm(path.join(fixture.appDir, 'src/entry.server.tsx'));
    }
    port = await getPort();
    const result = await modernBuild(fixture.appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    app = await modernServe(fixture.appDir, port);
    const response = await fetch(`http://127.0.0.1:${port}/stages`);
    expect(response.status).toBe(200);
    html = await response.text();
    report = JSON.parse(
      await readFile(
        path.join(fixture.appDir, 'dist/resource-stages.json'),
        'utf-8',
      ),
    );
    browser = await puppeteer.launch(launchOptions as any);
  });

  afterAll(async () => {
    await browser?.close();
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  test('maps every declaration to its chunks', () => {
    for (const request of [
      './Critical',
      './Visible',
      './Idle',
      './Reply',
      './Mention',
    ]) {
      expect(declaration(request).chunks.length).toBeGreaterThan(0);
      expect(declaration(request).level).toEqual(['route:stages/page']);
    }
  });

  test('writes the config and stage lists into the HTML', () => {
    const all = payloads(html);
    const config = all.find(payload => payload.c)?.c;
    expect(config.o).toEqual(['visible', 'interactive', 'firstReply', 'idle']);
    expect(config.m).toEqual(['firstReply']);

    const lists = (stage: string) =>
      all
        .flatMap(payload => [
          ...(payload.s?.[stage] ?? []),
          ...Object.values(payload.r ?? {}).flatMap(
            (route: any) => route.s?.[stage] ?? [],
          ),
        ])
        .map(String);
    expect(lists('visible')).toEqual(
      expect.arrayContaining(chunkIds('./Visible')),
    );
    expect(lists('idle')).toEqual(expect.arrayContaining(chunkIds('./Idle')));
    expect(lists('firstReply')).toEqual(
      expect.arrayContaining(chunkIds('./Reply')),
    );
    // Element stages are found at runtime, not listed.
    expect(lists('interaction')).toEqual([]);

    const css = Object.assign(
      {},
      ...all.map(payload => payload.k ?? {}),
      ...all.flatMap(payload =>
        Object.values(payload.r ?? {}).map((route: any) => route.k ?? {}),
      ),
    );
    const visibleCss = declaration('./Visible').chunks.flatMap(chunk =>
      chunk.files.filter(file => file.endsWith('.css')),
    );
    expect(Object.values(css).flat()).toEqual(
      expect.arrayContaining(visibleCss),
    );
  });

  test('preloads critical declarations of the matched route', () => {
    const links = preloads(html);
    if (mode === 'csr') {
      // The route is only known in the browser.
      expect(links).not.toEqual(expect.arrayContaining(jsFiles('./Critical')));
    } else {
      expect(links).toEqual(expect.arrayContaining(jsFiles('./Critical')));
    }
    for (const request of ['./Visible', './Idle', './Reply', './Mention']) {
      for (const file of jsFiles(request)) {
        expect(links).not.toContain(file);
      }
    }
  });

  test('prefetches each stage when it arrives', async () => {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/stages`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('#critical');
    await page.waitForFunction(
      () => (window as any).__MODERN_RS__?.report?.().stages.idle !== undefined,
      { timeout: 15000 },
    );
    await page.hover('#mention');
    await page.waitForFunction(
      () =>
        (window as any).__MODERN_RS__
          .report()
          .records.some(
            (record: any) =>
              record.stage === 'interaction' &&
              record.prefetchEnd !== undefined,
          ),
      { timeout: 5000 },
    );
    const result = await page.evaluate(() =>
      (window as any).__MODERN_RS__.report(),
    );
    await page.close();

    expect(errors).toEqual([]);
    const { stages, records } = result as {
      stages: Record<string, number>;
      records: {
        chunkId: string | number;
        stage?: string;
        prefetchEnd?: number;
      }[];
    };
    expect(stages.visible).toBeLessThanOrEqual(stages.interactive);
    expect(stages.interactive).toBeLessThanOrEqual(stages.firstReply);
    expect(stages.firstReply).toBeLessThanOrEqual(stages.idle);
    const stageOf = (request: string) =>
      chunkIds(request).map(
        id => records.find(record => String(record.chunkId) === id)?.stage,
      );
    expect(stageOf('./Visible')).toContain('visible');
    expect(stageOf('./Reply')).toContain('firstReply');
    expect(stageOf('./Idle')).toContain('idle');
    expect(stageOf('./Mention')).toContain('interaction');
    expect(
      records
        .filter(record => record.stage)
        .every(record => record.prefetchEnd !== undefined),
    ).toBe(true);
  });
});
