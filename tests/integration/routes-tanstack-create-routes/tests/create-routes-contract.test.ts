/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import {
  acquireFixtureLock,
  type ReleaseFixtureLock,
} from '../../../utils/fixtureLock';
import { modernBuild } from '../../../utils/modernTestUtils';

const projectRoot = path.resolve(__dirname, '../../..');
const repoRoot = path.resolve(__dirname, '../../../..');
const appDir = path.join(
  projectRoot,
  'integration/routes-tanstack-create-routes',
);

const readFixture = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const readFixtureJson = (relativePath: string) =>
  JSON.parse(readFixture(relativePath));

describe('tanstack create-routes contracts', () => {
  let releaseFixtureLock: ReleaseFixtureLock | undefined;

  beforeAll(async () => {
    releaseFixtureLock = await acquireFixtureLock(appDir);
    await modernBuild(appDir);
  });

  afterAll(async () => {
    await releaseFixtureLock?.();
  });

  test('publishes the tanstack router plugin runtime subpath export', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, 'packages/runtime/plugin-tanstack/package.json'),
        'utf8',
      ),
    );

    expect(packageJson.exports['./runtime']).toEqual(
      expect.objectContaining({
        types: './dist/types/runtime/index.d.ts',
        default: './dist/esm/runtime/index.mjs',
      }),
    );
    expect(packageJson.typesVersions['*'].runtime).toEqual([
      './dist/types/runtime/index.d.ts',
    ]);
  });

  test('generated register file augments tanstack router register interface', () => {
    const code = readFixture(
      'integration/routes-tanstack-create-routes/src/modern-tanstack/register.gen.d.ts',
    );

    expect(code).toContain(
      "import type { router as router0 } from './index/router.gen';",
    );
    expect(code).toContain(
      "declare module '@modern-js/plugin-tanstack/runtime'",
    );
    expect(code).toContain('interface Register');
    expect(code).toContain('router: typeof router0;');
  });

  test('generated route manifest preserves SPA/SSR hybrid route semantics', () => {
    const routeManifest = readFixtureJson(
      'integration/routes-tanstack-create-routes/dist/route.json',
    );

    expect(Array.isArray(routeManifest.routes)).toBe(true);
    expect(routeManifest.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urlPath: '/',
          entryName: 'index',
          entryPath: 'html/index/index.html',
          isSPA: true,
          isSSR: true,
          isStream: false,
          isRSC: false,
          bundle: 'bundles/index.js',
        }),
      ]),
    );
  });
});
