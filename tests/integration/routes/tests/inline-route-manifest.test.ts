import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createIsolatedTestApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '..');

// A business lazy chunk whose name happens to start with `<entry>_`, the same
// shape as route ids, so a prefix-based filter would keep it.
const CUSTOM_CHUNK_NAME = 'three_lazy-widget';

type RouteAssets = Record<string, { chunkIds?: unknown[] }>;
type RouteLike = { id?: string; children?: RouteLike[] };

const collectRouteIds = (routes: RouteLike[], ids = new Set<string>()) => {
  for (const route of routes) {
    if (route.id) ids.add(route.id);
    if (route.children) collectRouteIds(route.children, ids);
  }
  return ids;
};

const parseInlineManifest = (html: string): RouteAssets => {
  const match = html.match(
    /window\._MODERNJS_ROUTE_MANIFEST\s*=\s*(\{[\s\S]*?\});\s*\}\)\(\);/,
  );
  expect(match, 'inline route manifest').toBeTruthy();
  return JSON.parse(match![1]).routeAssets;
};

describe('multiple entries route manifest', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let dist: string;
  let diskRouteAssets: RouteAssets;
  let nestedRoutes: Record<string, RouteLike[]>;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    const { appDir } = fixture;
    await writeFile(
      path.join(appDir, 'src/three/routes/LazyWidget.tsx'),
      'export default function LazyWidget() { return <div>Lazy widget</div>; }\n',
    );
    await writeFile(
      path.join(appDir, 'src/three/routes/page.tsx'),
      `import { Suspense, lazy } from 'react';

const LazyWidget = lazy(
  () => import(/* webpackChunkName: "${CUSTOM_CHUNK_NAME}" */ './LazyWidget'),
);

export default function Page() {
  return (
    <div>
      Page
      <Suspense fallback={null}>
        <LazyWidget />
      </Suspense>
    </div>
  );
}
`,
    );

    const result = await modernBuild(appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);

    dist = path.join(appDir, 'dist');
    diskRouteAssets = JSON.parse(
      await readFile(path.join(dist, 'routes-manifest.json'), 'utf-8'),
    ).routeAssets;
    nestedRoutes = JSON.parse(
      await readFile(path.join(dist, 'nestedRoutes.json'), 'utf-8'),
    );
  });

  afterAll(async () => {
    await fixture?.cleanup();
  });

  test('on-disk routes-manifest.json keeps every chunk group', () => {
    expect(diskRouteAssets[CUSTOM_CHUNK_NAME]).toBeDefined();
    expect(diskRouteAssets.three).toBeDefined();
  });

  test.each(['three', 'four'])(
    'inline route manifest of %s only contains its route ids',
    async entryName => {
      const html = await readFile(
        path.join(dist, 'html', entryName, 'index.html'),
        'utf-8',
      );
      const clientKeys = Object.keys(parseInlineManifest(html)).sort();
      const routeIds = collectRouteIds(nestedRoutes[entryName]);
      const expected = Object.keys(diskRouteAssets)
        .filter(id => routeIds.has(id))
        .sort();
      expect(expected.length).toBeGreaterThan(0);
      expect(clientKeys).toEqual(expected);
      expect(clientKeys).not.toContain(entryName);
      expect(clientKeys).not.toContain(CUSTOM_CHUNK_NAME);
    },
  );
});
