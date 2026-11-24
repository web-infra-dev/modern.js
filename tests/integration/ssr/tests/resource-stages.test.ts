import type { ChildProcess } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
import { Link } from '@modern-js/runtime/router';
import { stagedImport } from '@modern-js/runtime/resources';

const Critical = lazy(stagedImport.critical(() => import('./Critical')));
const loadVisible = stagedImport.visible(() => import('./Visible'));
const loadIdle = stagedImport.idle(() => import('./Idle'));
const loadReply = stagedImport.firstReply(() => import('./Reply'));
// 提及面板：multi-byte text before a declaration the build adds a key to.
const loadMention = stagedImport.interaction(() => import('./Mention'));

export default function Page() {
  return (
    <Suspense fallback="loading">
      <Critical />
      <input id="mention" ref={loadMention.trigger} />
      <Link id="about" prefetch="intent" to="/about">about</Link>
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
      routes: true,
      idleQuietTime: 300,
    },
  },
});`,
  );
  const dir = path.join(appDir, 'src/routes/stages');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'page.tsx'), pageSource);
  for (const name of ['Idle', 'Reply']) {
    await writeFile(path.join(dir, `${name}.tsx`), component(name));
  }
  for (const name of ['Critical', 'Visible', 'Mention']) {
    await writeFile(path.join(dir, `${name}.tsx`), component(name, true));
    await writeFile(
      path.join(dir, `${name}.css`),
      `#${name.toLowerCase()} { color: red; }`,
    );
  }
  // Prefetching an element stage must not run the module.
  await writeFile(
    path.join(dir, 'Mention.tsx'),
    `(window as any).__mentionExecuted = true;\n${component('Mention', true)}`,
  );
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
    // Element stages are not page stage lists: the build maps each
    // declaration key to its chunks and CSS, prefetched when it triggers.
    expect(lists('interaction')).toEqual([]);
    const elements = Object.values(
      Object.assign({}, ...all.map(payload => payload.e ?? {})),
    ) as { s: (string | number)[]; k?: Record<string, string[]> }[];
    const mention = elements.find(element =>
      element.s.map(String).some(id => chunkIds('./Mention').includes(id)),
    );
    expect(mention).toBeDefined();
    const mentionCss = declaration('./Mention').chunks.flatMap(chunk =>
      chunk.files.filter(file => file.endsWith('.css')),
    );
    expect(mentionCss.length).toBeGreaterThan(0);
    const mappedCss = Object.values(mention!.k ?? {}).flat();
    for (const file of mentionCss) {
      expect(mappedCss.some(item => file.endsWith(item))).toBe(true);
    }

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
    // The lists keep CSS relative to the public path the browser uses.
    const listedCss = Object.values(css).flat() as string[];
    for (const file of visibleCss) {
      expect(listedCss.some(item => file.endsWith(item))).toBe(true);
    }
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

  test('does not preload a stylesheet the HTML already has', () => {
    const tags = html.match(/<link\b[^>]*>/g) ?? [];
    const hrefOf = (tag: string) => tag.match(/\bhref="([^"]+)"/)?.[1];
    const stylesheets = new Set(
      tags.filter(tag => /\brel="stylesheet"/.test(tag)).map(hrefOf),
    );
    const stylePreloads = tags
      .filter(tag => /\brel="preload"/.test(tag) && /\bas="style"/.test(tag))
      .map(hrefOf);
    for (const href of stylePreloads) {
      expect(stylesheets.has(href)).toBe(false);
    }
    expect(new Set(stylePreloads).size).toBe(stylePreloads.length);
  });

  test('preloads route JS at low priority and no route CSS', () => {
    if (mode !== 'stream') {
      // The route rule only applies to streaming SSR.
      return;
    }
    const tags = html.match(/<link\b[^>]*\brel="preload"[^>]*>/g) ?? [];
    const declared = jsFiles('./Critical');
    const routeTags = tags.filter(
      tag => !declared.some(file => tag.includes(`href="${file}"`)),
    );
    expect(routeTags.length).toBeGreaterThan(0);
    for (const tag of routeTags) {
      expect(tag).toContain('as="script"');
      expect(tag).toContain('fetchpriority="low"');
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
    // The router prefetches the route on hover; recorded apart from the
    // application's requests.
    await page.hover('#about');
    await page.waitForFunction(
      () =>
        (window as any).__MODERN_RS__
          .report()
          .records.some((record: any) => record.source === 'link'),
      { timeout: 5000 },
    );
    const result = await page.evaluate(() =>
      (window as any).__MODERN_RS__.report(),
    );
    const mentionExecuted = await page.evaluate(
      () => (window as any).__mentionExecuted === true,
    );
    await page.close();
    expect(mentionExecuted).toBe(false);

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
    expect(
      records
        .filter(record => record.stage)
        .every((record: any) => record.prefetchStatus === 'ok'),
    ).toBe(true);
  });
});

describe.each([
  [
    'Subresource Integrity',
    `security: { sri: true }, performance: { resourceStages: {} }`,
    { x: 'anonymous', z: 1 },
  ],
  [
    'crossOriginLoading from tools.rspack',
    `tools: { rspack(config) { config.output = { ...config.output, crossOriginLoading: 'anonymous' }; } }, performance: { resourceStages: {} }`,
    { x: 'anonymous' },
  ],
  [
    'route declarations only, without config and split chunks',
    `security: { sri: true }, tools: { rspack(config) { config.optimization = { ...config.optimization, splitChunks: false, runtimeChunk: false }; } }`,
    { x: 'anonymous', z: 1 },
  ],
] as const)('resource stages runtime config (%s)', (_, appConfig, expected) => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  test('writes the final crossorigin settings into the HTML', async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    await writeFile(
      path.join(fixture.appDir, 'modern.config.ts'),
      `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({ server: { ssr: true }, ${appConfig} });`,
    );
    const dir = path.join(fixture.appDir, 'src/routes/stages');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'page.tsx'),
      `import { stagedImport } from '@modern-js/runtime/resources';
const loadVisible = stagedImport.visible(() => import('./Visible'));
export default function Page() {
  return <button id="load" type="button" onClick={() => loadVisible()}>load</button>;
}
`,
    );
    await writeFile(path.join(dir, 'Visible.tsx'), component('Visible'));
    const port = await getPort();
    const result = await modernBuild(fixture.appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    app = await modernServe(fixture.appDir, port);
    const html = await (await fetch(`http://127.0.0.1:${port}/stages`)).text();
    const runtimeConfig = payloads(html).find(payload => payload.c)?.c;
    expect(runtimeConfig).toMatchObject(expected);
  });
});

describe.each([
  [2, false],
  [1, true],
] as const)(
  'resource stages (critical budget of layout and page, %s requests)',
  (requests, overBudget) => {
    let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
    let app: ChildProcess | undefined;

    afterAll(async () => {
      if (app) {
        await killApp(app);
      }
      await fixture?.cleanup?.();
    });

    test('combines the entry, the layout and the page into one budget', async () => {
      fixture = await createIsolatedTestApp(fixtureDir);
      await writeFile(
        path.join(fixture.appDir, 'modern.config.ts'),
        `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: true },
  performance: { resourceStages: { budget: { critical: { requests: ${requests} } } } },
});`,
      );
      const dir = path.join(fixture.appDir, 'src/routes/stages');
      await mkdir(dir, { recursive: true });
      const declare = (name: string) =>
        `const ${name} = lazy(stagedImport.critical(() => import('./${name}')));`;
      await writeFile(
        path.join(dir, 'layout.tsx'),
        `import { Suspense, lazy } from 'react';
import { Outlet } from '@modern-js/runtime/router';
import { stagedImport } from '@modern-js/runtime/resources';
${declare('Shell')}
export default function Layout() {
  return <Suspense fallback="loading"><Shell /><Outlet /></Suspense>;
}
`,
      );
      await writeFile(
        path.join(dir, 'page.tsx'),
        `import { Suspense, lazy } from 'react';
import { stagedImport } from '@modern-js/runtime/resources';
${declare('Critical')}
export default function Page() {
  return <Suspense fallback="loading"><Critical /></Suspense>;
}
`,
      );
      for (const name of ['Shell', 'Critical']) {
        await writeFile(path.join(dir, `${name}.tsx`), component(name, true));
        await writeFile(
          path.join(dir, `${name}.css`),
          `#${name.toLowerCase()} { color: red; }`,
        );
      }
      const port = await getPort();
      const result = await modernBuild(fixture.appDir);
      expect(result.code, result.stderr || result.stdout).toBe(0);
      app = await modernServe(fixture.appDir, port);
      const html = await (
        await fetch(`http://127.0.0.1:${port}/stages`)
      ).text();
      const report: Report = JSON.parse(
        await readFile(
          path.join(fixture.appDir, 'dist/resource-stages.json'),
          'utf-8',
        ),
      );
      const links = preloads(html);
      const jsOf = (request: string) =>
        report.declarations
          .find(item => item.request === request)!
          .chunks.flatMap(chunk =>
            chunk.files.filter(file => file.endsWith('.js')),
          );
      const output = `${result.stdout}\n${result.stderr}`;
      // The layout is matched first and keeps its place in the budget.
      expect(links).toEqual(expect.arrayContaining(jsOf('./Shell')));
      if (overBudget) {
        // Each target fits on its own; only the page as a whole does not.
        expect(output).toContain(
          'page "stages/page": the entry, its layouts and the page together exceed the critical budget',
        );
        for (const file of jsOf('./Critical')) {
          expect(links).not.toContain(file);
        }
      } else {
        // Stylesheets the HTML has are not counted, so both JS files fit.
        expect(links).toEqual(expect.arrayContaining(jsOf('./Critical')));
        expect(output).not.toContain('together exceed the critical budget');
        // Nothing declared critical fell back to a later stage.
        expect(
          payloads(html).some(payload => Object.keys(payload.s ?? {}).length),
        ).toBe(false);
      }
    });
  },
);

describe('resource stages (not used)', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let browser: Browser;

  afterAll(async () => {
    await browser?.close();
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  test('adds nothing to an application without declarations and config', async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const port = await getPort();
    const result = await modernBuild(fixture.appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);

    const jsDir = path.join(fixture.appDir, 'dist/static/js');
    const files = (await readdir(jsDir, { recursive: true })).filter(file =>
      file.endsWith('.js'),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      // The flag the scheduler leaves on the chunk loader it wraps.
      expect(await readFile(path.join(jsDir, file), 'utf-8')).not.toContain(
        '__rs',
      );
    }

    app = await modernServe(fixture.appDir, port);
    browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    const response = await page.goto(`http://127.0.0.1:${port}/about`, {
      waitUntil: ['networkidle0'],
    });
    const text = await response!.text();
    expect(text).not.toContain('__MODERN_RS__');
    // Route JS is only preloaded as part of resource stages.
    expect(text).not.toMatch(/<link\b[^>]*\bas="script"/);
    expect(await page.evaluate(() => '__MODERN_RS__' in (window as any))).toBe(
      false,
    );
  });
});

describe('resource stages (multiple entries)', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let browser: Browser;
  let port: number;
  let report: Report;

  const entryPage = (
    name: string,
  ) => `import { stagedImport } from '@modern-js/runtime/resources';
import { shared } from '../../shared-lib';

const load = stagedImport.idle(() => import('./${name}'));

export default function Page() {
  return <button id="load" type="button" onClick={() => load()}>{shared('${name}')}</button>;
}
`;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const { appDir } = fixture;
    await writeFile(
      path.join(appDir, 'modern.config.ts'),
      `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  performance: { resourceStages: { idleQuietTime: 300 } },
  tools: {
    rspack(config) {
      const splitChunks = config.optimization?.splitChunks;
      if (splitChunks) {
        splitChunks.cacheGroups = {
          ...splitChunks.cacheGroups,
          // A chunk both entries share, and a chunk with only CSS.
          sharedLib: { test: /shared-lib/, name: 'shared-lib', chunks: 'all', enforce: true },
          onlyStyles: { test: /\\.css$/, name: 'only-styles', chunks: 'async', enforce: true },
        };
      }
      // Some CSS setups emit no JS file for a chunk with only CSS.
      config.plugins?.push({
        apply(compiler) {
          compiler.hooks.thisCompilation.tap('drop-css-chunk-js', compilation => {
            compilation.hooks.processAssets.tap(
              { name: 'drop-css-chunk-js', stage: 1000 },
              assets => {
                for (const name of Object.keys(assets)) {
                  if (/only-styles\\.[^.]+\\.js$/.test(name)) {
                    compilation.deleteAsset(name);
                  }
                }
              },
            );
          });
        },
      });
    },
  },
});`,
    );
    await rm(path.join(appDir, 'src/routes'), { recursive: true });
    await rm(path.join(appDir, 'src/entry.server.tsx'));
    await writeFile(
      path.join(appDir, 'src/shared-lib.ts'),
      // A function, so the bundler cannot inline the export and drop the module.
      `export const shared = (name: string) => ['shared', name].join(' ');\n`,
    );
    for (const entry of ['first', 'second']) {
      const name = entry === 'first' ? 'First' : 'Second';
      const dir = path.join(appDir, 'src', entry, 'routes');
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'layout.tsx'),
        `import { Outlet } from '@modern-js/runtime/router';
export default () => <Outlet />;
`,
      );
      await writeFile(path.join(dir, 'page.tsx'), entryPage(name));
      await writeFile(path.join(dir, `${name}.tsx`), component(name, true));
      await writeFile(
        path.join(dir, `${name}.css`),
        `#${name.toLowerCase()} { color: red; }`,
      );
    }
    port = await getPort();
    const result = await modernBuild(appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    report = JSON.parse(
      await readFile(path.join(appDir, 'dist/resource-stages.json'), 'utf-8'),
    );
    app = await modernServe(appDir, port);
    browser = await puppeteer.launch(launchOptions as any);
  });

  afterAll(async () => {
    await browser?.close();
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  const idleChunks = (html: string) =>
    payloads(html)
      .flatMap(payload =>
        Object.values(payload.r ?? {}).flatMap(
          (route: any) => route.s?.idle ?? [],
        ),
      )
      .map(String);
  const chunksOf = (request: string) =>
    report.declarations
      .find(item => item.request === request)!
      .chunks.map(chunk => String(chunk.id));

  test('keeps the route lists with the entry that owns the route', async () => {
    const htmlOf = async (entry: string) =>
      (await fetch(`http://127.0.0.1:${port}/${entry}`)).text();
    const first = idleChunks(await htmlOf('first'));
    const second = idleChunks(await htmlOf('second'));
    expect(first).toEqual(expect.arrayContaining(chunksOf('./First')));
    expect(second).toEqual(expect.arrayContaining(chunksOf('./Second')));
    expect(first).not.toEqual(expect.arrayContaining(chunksOf('./Second')));
    expect(second).not.toEqual(expect.arrayContaining(chunksOf('./First')));
  });

  test('does not request a script for a chunk with only CSS', async () => {
    const cssOnly = report.declarations
      .flatMap(item => item.chunks)
      .filter(chunk => !chunk.files.some(file => file.endsWith('.js')))
      .map(chunk => String(chunk.id));
    expect(cssOnly.length).toBeGreaterThan(0);

    const html = await (await fetch(`http://127.0.0.1:${port}/second`)).text();
    const listed = payloads(html).flatMap(payload =>
      (payload.d ?? []).map(String),
    );
    expect(listed).toEqual(expect.arrayContaining(cssOnly));

    const page = await browser.newPage();
    const failed: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failed.push(response.url());
      }
    });
    await page.goto(`http://127.0.0.1:${port}/second`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForFunction(
      () => {
        const report = (window as any).__MODERN_RS__?.report?.();
        return (
          report?.stages.idle !== undefined &&
          report.records.some((record: any) => record.stage === 'idle') &&
          report.records
            .filter((record: any) => record.stage)
            .every((record: any) => record.prefetchEnd !== undefined)
        );
      },
      { timeout: 15000 },
    );
    const prefetched = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="prefetch"]')].map(
        link => (link as HTMLLinkElement).href,
      ),
    );
    await page.close();
    expect(failed).toEqual([]);
    expect(prefetched.some(href => href.endsWith('.css'))).toBe(true);
    expect(prefetched.join()).not.toContain('undefined');
  });
});

describe('resource stages (declaration forms)', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let output: string;
  let html: string;
  let report: Report & {
    declarations: (Report['declarations'][number] & { line: number })[];
  };

  // Comment and blank lines first: the reported lines count them.
  const source = `// Declarations in the forms the build recognizes.
// The stage below is not configured.

import { Suspense, lazy } from 'react';
import { stagedImport } from '@modern-js/runtime/resources';

const Named = lazy(
  stagedImport.visible(() => import('./Named').then(m => ({ default: m.Named }))),
);
const loadAwaited = stagedImport.idle(async () => {
  return await import('./Awaited');
});
// @ts-expect-error not a configured stage
const loadUnknown = stagedImport.notConfigured(() => import('./Unknown'));

export default function Page() {
  return (
    <Suspense fallback="loading">
      <Named />
      <button id="load" type="button" onClick={() => Promise.all([loadAwaited(), loadUnknown()])}>load</button>
    </Suspense>
  );
}
`;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const { appDir } = fixture;
    await writeFile(
      path.join(appDir, 'modern.config.ts'),
      `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: true },
  performance: { resourceStages: { idleQuietTime: 300 } },
});`,
    );
    const dir = path.join(appDir, 'src/routes/stages');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'page.tsx'), source);
    await writeFile(
      path.join(dir, 'Named.tsx'),
      'export const Named = () => <div id="named">Named component</div>;\n',
    );
    for (const name of ['Awaited', 'Unknown']) {
      await writeFile(path.join(dir, `${name}.tsx`), component(name));
    }
    const result = await modernBuild(appDir);
    output = `${result.stdout}\n${result.stderr}`;
    expect(result.code, output).toBe(0);
    report = JSON.parse(
      await readFile(path.join(appDir, 'dist/resource-stages.json'), 'utf-8'),
    );
    const port = await getPort();
    app = await modernServe(appDir, port);
    html = await (await fetch(`http://127.0.0.1:${port}/stages`)).text();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  test('recognizes .then() and async functions, with source lines', () => {
    const find = (request: string) =>
      report.declarations.find(item => item.request === request);
    expect(find('./Named')).toMatchObject({ stage: 'visible', line: 8 });
    expect(find('./Awaited')).toMatchObject({ stage: 'idle', line: 10 });
    expect(find('./Named')!.chunks.length).toBeGreaterThan(0);
  });

  test('warns about an unknown stage without failing the build', () => {
    expect(output).toContain('unknown resource stage "notConfigured"');
    expect(
      report.declarations.find(item => item.request === './Unknown'),
    ).toBeUndefined();
  });

  test('does not preload route JS unless routes is set', () => {
    expect(html).not.toMatch(/<link\b[^>]*\bfetchpriority="low"/);
    expect(html).toContain('__MODERN_RS__');
  });
});

describe('resource stages (loadable with string SSR)', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await fixture?.cleanup?.();
  });

  test('renders a staged loadable component on the server', async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const { appDir } = fixture;
    await writeFile(
      path.join(appDir, 'modern.config.ts'),
      `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: { mode: 'string' } },
});`,
    );
    await rm(path.join(appDir, 'src/entry.server.tsx'));
    const dir = path.join(appDir, 'src/routes/stages');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'page.tsx'),
      `import loadable from '@modern-js/runtime/loadable';
import { stagedImport } from '@modern-js/runtime/resources';

const Editor = loadable(stagedImport.idle(() => import('./Editor')));

export default function Page() {
  return <Editor />;
}
`,
    );
    await writeFile(path.join(dir, 'Editor.tsx'), component('Editor'));
    const result = await modernBuild(appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    const port = await getPort();
    app = await modernServe(appDir, port);
    const html = await (await fetch(`http://127.0.0.1:${port}/stages`)).text();
    expect(html).toContain('Editor component');
  });
});
