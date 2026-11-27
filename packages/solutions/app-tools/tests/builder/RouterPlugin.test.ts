import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { createRsbuild } from '@rsbuild/core';
import { RouterPlugin } from '../../src/builder/shared/bundlerPlugins/RouterPlugin';

it.each([true, false])(
  'keeps route chunk IDs on the producer runtime only for application exposes (%s)',
  async exposed => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'modern-prefetch-manifest-'),
    );
    try {
      await fs.writeFile(
        path.join(directory, 'entry.js'),
        `
export const manifest = () => __webpack_require__.modernRouteManifest;
export const detail = () => import(/* webpackChunkName: "product/detail/page" */ './detail.js');
`,
      );
      await fs.writeFile(
        path.join(directory, 'detail.js'),
        'export default "detail"',
      );
      const rsbuild = await createRsbuild({
        cwd: directory,
        rsbuildConfig: {
          source: {
            entry: { index: `./entry.js${exposed ? '?modern-mf-root' : ''}` },
          },
          output: {
            distPath: { root: path.join(directory, 'dist') },
            filenameHash: false,
            minify: false,
            assetPrefix: 'https://producer.example/',
          },
          performance: { chunkSplit: { strategy: 'all-in-one' } },
          tools: {
            rspack(config, { rspack }) {
              config.output!.library = { type: 'var', name: 'Producer' };
              config.plugins!.push(
                new RouterPlugin({
                  HtmlBundlerPlugin: rspack.HtmlRspackPlugin,
                  enableInlineRouteManifests: true,
                }),
              );
            },
          },
        },
      });
      const result = await rsbuild.build();
      try {
        const bundle = await fs.readFile(
          path.join(directory, 'dist/static/js/index.js'),
          'utf8',
        );
        const context = vm.createContext({ self: {}, console });
        vm.runInContext(bundle, context);
        const manifest = context.Producer.manifest();
        if (exposed) {
          const emitted = JSON.parse(
            await fs.readFile(
              path.join(directory, 'dist', ROUTE_MANIFEST_FILE),
              'utf8',
            ),
          );
          expect(manifest.routeAssets['product/detail/page'].chunkIds).toEqual(
            emitted.routeAssets['product/detail/page'].chunkIds,
          );
          expect(
            manifest.routeAssets['product/detail/page'].chunkIds.length,
          ).toBeGreaterThan(0);
          expect(
            manifest.routeAssets['product/detail/page'].assets,
          ).toBeUndefined();
        } else {
          expect(manifest).toBeUndefined();
        }
      } finally {
        await result.close();
      }
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  },
);
