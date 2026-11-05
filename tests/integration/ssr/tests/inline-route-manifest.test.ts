import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createIsolatedTestApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

// A business lazy chunk named with `webpackChunkName`: it becomes a named
// chunk group, so it lands in `routes-manifest.json`, but it is not a route.
const CUSTOM_CHUNK_NAME = 'custom-lazy-widget';

type RouteAssets = Record<string, { chunkIds?: unknown[] }>;
type RouteLike = { id?: string; children?: RouteLike[] };

const collectRouteIds = (routes: RouteLike[], ids = new Set<string>()) => {
  for (const route of routes) {
    if (route.id) ids.add(route.id);
    if (route.children) collectRouteIds(route.children, ids);
  }
  return ids;
};

const parseManifestScript = (content: string): RouteAssets => {
  const match = content.match(
    /window\._MODERNJS_ROUTE_MANIFEST\s*=\s*(\{[\s\S]*?\});\s*\}\)\(\);/,
  );
  expect(match, 'route manifest script').toBeTruthy();
  return JSON.parse(match![1]).routeAssets;
};

describe.each([
  ['inline', `{}`],
  ['external script', `{ disableInlineRouteManifests: true }`],
] as const)('single entry route manifest (%s)', (_name, output) => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let clientRouteAssets: RouteAssets;
  let diskRouteAssets: RouteAssets;
  let routeIds: Set<string>;
  let entryName: string;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const { appDir } = fixture;
    await writeFile(
      path.join(appDir, 'modern.config.ts'),
      `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: true },
  performance: { prefetch: true },
  output: ${output},
});`,
    );
    const lazyPage = path.join(appDir, 'src/routes/lazy/page.tsx');
    await writeFile(
      lazyPage,
      (await readFile(lazyPage, 'utf-8')).replace(
        "import('./lazy')",
        `import(/* webpackChunkName: "${CUSTOM_CHUNK_NAME}" */ './lazy')`,
      ),
    );

    const result = await modernBuild(appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);

    const dist = path.join(appDir, 'dist');
    const htmlEntries = await readdir(path.join(dist, 'html'));
    expect(htmlEntries).toHaveLength(1);
    [entryName] = htmlEntries;
    const html = await readFile(
      path.join(dist, 'html', entryName, 'index.html'),
      'utf-8',
    );
    if (output.includes('disableInlineRouteManifests')) {
      const src = html.match(
        /<script[^>]*src="\/?([^"]*route-manifest-[^"]+\.js)"/,
      );
      expect(src, 'external route manifest script').toBeTruthy();
      clientRouteAssets = parseManifestScript(
        await readFile(path.join(dist, src![1]), 'utf-8'),
      );
    } else {
      clientRouteAssets = parseManifestScript(html);
    }
    diskRouteAssets = JSON.parse(
      await readFile(path.join(dist, 'routes-manifest.json'), 'utf-8'),
    ).routeAssets;
    const nestedRoutes = JSON.parse(
      await readFile(path.join(dist, 'nestedRoutes.json'), 'utf-8'),
    );
    routeIds = collectRouteIds(nestedRoutes[entryName]);
  });

  afterAll(async () => {
    await fixture?.cleanup();
  });

  test('on-disk routes-manifest.json keeps every chunk group', () => {
    expect(diskRouteAssets[CUSTOM_CHUNK_NAME]).toBeDefined();
    expect(diskRouteAssets[entryName]).toBeDefined();
    expect(diskRouteAssets['user/(id)/page']).toBeDefined();
  });

  test('client route manifest only contains route ids', () => {
    const clientKeys = Object.keys(clientRouteAssets).sort();
    const expected = Object.keys(diskRouteAssets)
      .filter(id => routeIds.has(id))
      .sort();
    expect(expected).toContain('user/(id)/page');
    expect(clientKeys).toEqual(expected);
    expect(clientKeys).not.toContain(CUSTOM_CHUNK_NAME);
    expect(clientKeys).not.toContain(entryName);
    expect(clientRouteAssets['user/(id)/page'].chunkIds).toEqual(
      diskRouteAssets['user/(id)/page'].chunkIds,
    );
  });
});
