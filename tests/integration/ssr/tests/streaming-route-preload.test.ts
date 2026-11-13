import type { ChildProcess } from 'node:child_process';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

type RouteAssets = Record<string, { assets?: string[]; ownAssets?: string[] }>;

const getScriptPreloads = (html: string) =>
  [
    ...html.matchAll(
      /<link\b[^>]*\brel="preload"[^>]*\bas="script"[^>]*\bhref="([^"]+)"[^>]*>/g,
    ),
  ].map(match => match[1]);

const getScriptSrcs = (html: string) =>
  [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(
    match => match[1],
  );

const writeConfig = (appDir: string, ssr: string) =>
  writeFile(
    path.join(appDir, 'modern.config.ts'),
    `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: ${ssr} },
  performance: { prefetch: true },
});`,
  );

describe.each([
  ['development', 'true'],
  ['production', 'true'],
  ['production', `{ preloadRouteScripts: false }`],
  ['production', `{ mode: 'string' }`],
] as const)('route script preload (%s, ssr: %s)', (mode, ssr) => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let html: string;
  let routeAssets: RouteAssets;
  let entryName: string;

  beforeAll(async () => {
    // Build/dev must not share generated files with the other streaming tests.
    fixture = await createIsolatedTestApp(fixtureDir);
    await writeConfig(fixture.appDir, ssr);
    if (ssr.includes('string')) {
      // The fixture's custom server entry always calls `renderStreaming`.
      await rm(path.join(fixture.appDir, 'src/entry.server.tsx'));
    }
    const port = await getPort();
    if (mode === 'production') {
      const result = await modernBuild(fixture.appDir);
      expect(result.code, result.stderr || result.stdout).toBe(0);
      app = await modernServe(fixture.appDir, port);
    } else {
      app = await launchApp(fixture.appDir, port);
    }
    const response = await fetch(`http://127.0.0.1:${port}/user/1`);
    expect(response.status).toBe(200);
    html = await response.text();
    routeAssets = JSON.parse(
      await readFile(
        path.join(fixture.appDir, 'dist/routes-manifest.json'),
        'utf-8',
      ),
    ).routeAssets;
    [entryName] = await readdir(path.join(fixture.appDir, 'dist/html'));
  });

  afterAll(async () => {
    try {
      if (app) await killApp(app);
    } finally {
      await fixture?.cleanup();
    }
  });

  const matchedRouteIds = ['user/layout', 'user/(id)/page'];

  const getRouteScripts = () => {
    const entryAssets = new Set(routeAssets[entryName].assets);
    return [
      ...new Set(
        matchedRouteIds.flatMap(
          id =>
            routeAssets[id].assets?.filter(
              asset => asset.endsWith('.js') && !entryAssets.has(asset),
            ) ?? [],
        ),
      ),
    ];
  };

  test('each matched route has its own js chunk', () => {
    expect(html).toContain('User layout');
    for (const id of matchedRouteIds) {
      const routeChunk = `/async/${id}`;
      expect(
        getRouteScripts().some(asset => asset.includes(routeChunk)),
        `${id} js chunk`,
      ).toBe(true);
    }
  });

  if (ssr === 'true') {
    test('preloads every matched route js exactly once', () => {
      const preloads = getScriptPreloads(html);
      const routeScripts = getRouteScripts();
      for (const asset of routeScripts) {
        expect(
          preloads.filter(href => href === asset),
          asset,
        ).toHaveLength(1);
      }
      // No async chunk other than the matched route js is preloaded.
      expect(
        preloads.filter(
          href => href.includes('/async/') && !routeScripts.includes(href),
        ),
      ).toEqual([]);
    });

    test('preloads only the route module at the default priority', () => {
      const lowPriority = new Set(
        [
          ...html.matchAll(
            /<link\b[^>]*\bas="script"[^>]*\bhref="([^"]+)"[^>]*\bfetchpriority="low"[^>]*>/g,
          ),
        ].map(match => match[1]),
      );
      for (const id of matchedRouteIds) {
        const own = routeAssets[id].ownAssets ?? [];
        expect(
          own.some(asset => asset.includes(`/async/${id}`)),
          `${id} own chunk`,
        ).toBe(true);
        for (const asset of routeAssets[id].assets ?? []) {
          if (!getScriptPreloads(html).includes(asset)) continue;
          expect(lowPriority.has(asset), asset).toBe(!own.includes(asset));
        }
      }
    });

    test('does not preload the entry scripts', () => {
      const preloads = getScriptPreloads(html);
      for (const src of [
        ...getScriptSrcs(html),
        ...(routeAssets[entryName].assets ?? []),
      ]) {
        expect(preloads, src).not.toContain(src);
      }
    });
  } else {
    test('does not preload the matched route js', () => {
      const preloads = getScriptPreloads(html);
      for (const asset of getRouteScripts()) {
        expect(preloads, asset).not.toContain(asset);
      }
    });
  }

  if (ssr === `{ mode: 'string' }`) {
    test('string SSR keeps loading route js by script tags', () => {
      const srcs = getScriptSrcs(html);
      for (const asset of getRouteScripts()) {
        expect(srcs, asset).toContain(asset);
      }
    });
  }
});
