import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAsyncHook } from '@modern-js/plugin';
import {
  type CollectResult,
  collectRouteComponentFiles,
  normalizeModulePath,
} from '@modern-js/utils';
import { assign } from '@modern-js/utils/lodash';

/**
 * Chain regression for the stream-SSR lazy-compilation route-eager channel.
 *
 * The route generator (`router/cli/code/index.ts` `generateCode`) collects
 * route component files from the FINAL routes — i.e. AFTER every
 * `modifyFileSystemRoutes` consumer ran — and publishes them via the PUBLIC
 * `api.updateAppContext({ routeComponentFiles })` channel. The app-tools SSR
 * builder plugin reads them back as `BuilderOptions.routeComponentFiles`.
 *
 * This test exercises the REAL pieces of that pipeline:
 *  - a REAL `createAsyncHook` (same hook factory the CLI uses) for
 *    `modifyFileSystemRoutes`, with a SECOND tap that REPLACES a route
 *    component (so the final routes differ from the intermediate ones);
 *  - a faithful `getAppContext`/`updateAppContext` pair mirroring the plugin
 *    api (`updateAppContext` does an in-place `assign` into a shared context;
 *    `getAppContext` spreads it fresh each call);
 *  - the REAL `collectRouteComponentFiles` from `@modern-js/utils`.
 *
 * It asserts the value read back via `getAppContext().routeComponentFiles`
 * reflects the FINAL (replaced) component, not the intermediate one.
 */
describe('route component collection channel (modifyFileSystemRoutes → updateAppContext)', () => {
  let dir: string;
  let srcDir: string;
  const srcAlias = '@_modern_js_src';
  const entryName = 'main';

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-channel-'));
    srcDir = path.join(dir, 'src');
    fs.mkdirSync(path.join(srcDir, 'routes', 'about'), { recursive: true });
    // `original.tsx` is what an early plugin produced; `replaced.tsx` is what a
    // later `modifyFileSystemRoutes` consumer swaps in.
    fs.writeFileSync(path.join(srcDir, 'routes', 'about', 'original.tsx'), '');
    fs.writeFileSync(path.join(srcDir, 'routes', 'about', 'replaced.tsx'), '');
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('publishes the FINAL (replaced) route component through updateAppContext', async () => {
    // --- Faithful app-context channel (mirrors @modern-js/plugin cli/api.ts) ---
    let context: { routeComponentFiles?: Map<string, CollectResult> } = {};
    const api = {
      getAppContext: () => ({ ...context }),
      updateAppContext: (update: Partial<typeof context>) => {
        context = assign(context, update);
      },
    };

    // --- Real async hook chain with a second tap that REPLACES the component ---
    const modifyFileSystemRoutes =
      createAsyncHook<
        (params: { entrypoint: { entryName: string }; routes: any[] }) => {
          entrypoint: { entryName: string };
          routes: any[];
        }
      >();
    // Tap 1: identity (an early consumer that leaves routes untouched).
    modifyFileSystemRoutes.tap(params => params);
    // Tap 2: a later consumer that REPLACES the route component.
    modifyFileSystemRoutes.tap(({ entrypoint }) => ({
      entrypoint,
      routes: [{ _component: `${srcAlias}/routes/about/replaced.tsx` }],
    }));

    // --- Faithful simulation of the generateCode loop ---
    const routeComponentFiles = new Map<string, CollectResult>();
    const entrypoint = { entryName };
    // Intermediate routes (as an early plugin would emit them).
    const markedRoutes = [
      { _component: `${srcAlias}/routes/about/original.tsx` },
    ];

    const { routes } = await modifyFileSystemRoutes.call({
      entrypoint,
      routes: markedRoutes,
    });

    // Collect from the FINAL routes, then publish once via the public channel.
    routeComponentFiles.set(
      entryName,
      collectRouteComponentFiles(routes, srcDir, srcAlias),
    );
    api.updateAppContext({ routeComponentFiles });

    // --- Read back through a FRESH getAppContext (as app-tools analyze does) ---
    const collected = api.getAppContext().routeComponentFiles;
    const result = collected?.get(entryName);

    const replaced = normalizeModulePath(
      path.join(srcDir, 'routes', 'about', 'replaced.tsx'),
    );
    const original = normalizeModulePath(
      path.join(srcDir, 'routes', 'about', 'original.tsx'),
    );

    expect(result?.files.has(replaced)).toBe(true);
    // The intermediate component must NOT leak into the eager set.
    expect(result?.files.has(original)).toBe(false);
    expect(result?.files.size).toBe(1);
    expect(result?.unresolved).toEqual([]);
  });
});
