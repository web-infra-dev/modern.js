import path from 'path';
import { Compilation, Compiler } from 'webpack';
import { fs, ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { HtmlWebpackPlugin } from '@modern-js/uni-builder';
import {
  RouterPlugin,
  RouteAssets,
} from '../../src/builder/shared/bundlerPlugins';
import { compiler } from './compiler';

describe('webpack-router-plugin', () => {
  test('basic usage', async () => {
    const app = path.join(__dirname, './fixtures/router-plugin1');
    const distDir = path.join(app, 'dist');
    const entryFile = path.join(app, 'index.js');
    const stats = await compiler({
      entry: entryFile,
      context: app,
      mode: 'development',
      target: 'web',
      output: {
        path: distDir,
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
      plugins: [
        new RouterPlugin({
          staticJsDir: 'static/js',
          HtmlBundlerPlugin: HtmlWebpackPlugin,
          enableInlineRouteManifests: true,
        }),
        new HtmlWebpackPlugin({
          chunks: ['main'],
        }),
      ],
    });

    const res = stats?.toJson();
    const { outputPath } = res!;
    const indexHtml = path.join(outputPath!, 'index.html');
    const htmlContent = await fs.readFile(indexHtml);
    expect(htmlContent.includes('_MODERNJS_ROUTE_MANIFEST')).toBe(true);
    const manifestFile = path.join(distDir, ROUTE_MANIFEST_FILE);
    const manifest = await import(manifestFile);
    expect(manifest.routeAssets).toHaveProperty('main');
    expect(manifest.routeAssets).toHaveProperty('bar');

    await fs.remove(distDir);
  });

  test('support enableInlineRouteManifests is false', async () => {
    const app = path.join(__dirname, './fixtures/router-plugin1');
    const distDir = path.join(app, 'dist');
    const entryFile = path.join(app, 'index.js');
    const stats = await compiler({
      entry: entryFile,
      context: app,
      mode: 'production',
      target: 'web',
      output: {
        path: distDir,
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
      plugins: [
        new RouterPlugin({
          staticJsDir: '/',
          HtmlBundlerPlugin: HtmlWebpackPlugin,
          enableInlineRouteManifests: false,
        }),
        new HtmlWebpackPlugin({
          chunks: ['main'],
        }),
      ],
    });

    const res = stats?.toJson();
    const { outputPath } = res!;
    const indexHtml = path.join(outputPath!, 'index.html');
    expect(!indexHtml.includes('_MODERNJS_ROUTE_MANIFEST')).toBe(true);

    const outputFiles = await fs.readdir(path.join(outputPath!));
    const routeManifestFile = outputFiles.find(file =>
      file.startsWith('route-manifest'),
    );
    const routeManifestContent = await fs.readFile(
      path.join(distDir, routeManifestFile!),
    );
    expect(routeManifestContent.includes('_MODERNJS_ROUTE_MANIFEST')).toBe(
      true,
    );

    await fs.remove(distDir);
  });

  test('should not create manifest', async () => {
    const app = path.join(__dirname, './fixtures/router-plugin2');
    const distDir = path.join(app, 'dist');
    const entryFile = path.join(app, 'index.js');
    const stats = await compiler({
      entry: entryFile,
      context: app,
      mode: 'development',
      target: 'web',
      output: {
        path: distDir,
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
    });

    const res = stats?.toJson();
    const { outputPath } = res!;
    const mainBundle = path.join(outputPath!, 'main.js');
    const bundleContent = await fs.readFile(mainBundle);
    expect(bundleContent.includes('_MODERNJS_ROUTE_MANIFEST')).toBe(false);
    const manifestFile = path.join(distDir, ROUTE_MANIFEST_FILE);
    expect(await fs.pathExists(manifestFile)).toBeFalsy();

    await fs.remove(distDir);
  });

  test('merge custom router manifest', async () => {
    const app = path.join(__dirname, './fixtures/router-plugin3');
    const distDir = path.join(app, 'dist');
    const entryFile = path.join(app, 'index.js');

    const customRouterManifest: { routeAssets: RouteAssets } = {
      routeAssets: {
        main: {
          chunkIds: ['remote-chunk-id-1'],
          assets: [
            'http://localhost:3001/static/js/remote-entry.js',
            'http://localhost:3001/static/js/exoise-image.js',
          ],
          referenceCssAssets: [
            'http://localhost:3001/static/js/exoise-image.css',
          ],
        },
      },
    };

    const PatchRouterManifestWebpackPlugin = class {
      apply(compiler: Compiler) {
        const { sources } = compiler.webpack;
        compiler.hooks.thisCompilation.tap(
          'patchRouterManifest',
          compilation => {
            compilation.hooks.processAssets.tapPromise(
              {
                name: 'patchRouterManifest',
                stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
              },
              async () => {
                const prevManifest = compilation.getAsset(ROUTE_MANIFEST_FILE);
                if (!prevManifest) {
                  compilation.emitAsset(
                    ROUTE_MANIFEST_FILE,
                    new sources.RawSource(
                      JSON.stringify(customRouterManifest, null, 2),
                    ),
                  );
                }
              },
            );
          },
        );
      }
    };

    const stats = await compiler({
      entry: entryFile,
      context: app,
      mode: 'development',
      target: 'web',
      output: {
        path: distDir,
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
      plugins: [
        new RouterPlugin({
          staticJsDir: 'static/js',
          HtmlBundlerPlugin: HtmlWebpackPlugin,
          enableInlineRouteManifests: true,
        }),
        new HtmlWebpackPlugin({
          chunks: ['main'],
        }),
        new PatchRouterManifestWebpackPlugin(),
      ],
    });

    const res = stats?.toJson();
    const { outputPath } = res!;
    const indexHtml = path.join(outputPath!, 'index.html');
    const htmlContent = await fs.readFile(indexHtml);
    // test basic usage
    expect(htmlContent.includes('_MODERNJS_ROUTE_MANIFEST')).toBe(true);
    const manifestFile = path.join(distDir, ROUTE_MANIFEST_FILE);
    const manifest = await import(manifestFile);
    expect(manifest.routeAssets).toHaveProperty('main');
    expect(manifest.routeAssets).toHaveProperty('bar');

    // test merge
    customRouterManifest.routeAssets.main.assets?.forEach(asset => {
      expect(htmlContent.includes(asset)).toBe(true);
    });
    customRouterManifest.routeAssets.main.chunkIds?.forEach(chunkId => {
      expect(htmlContent.includes(chunkId)).toBe(true);
    });
    customRouterManifest.routeAssets.main.referenceCssAssets?.forEach(
      referenceCssAsset => {
        expect(htmlContent.includes(referenceCssAsset)).toBe(true);
      },
    );

    expect(
      manifest.routeAssets.main.chunkIds.length >
        customRouterManifest.routeAssets.main.chunkIds!.length,
    ).toBe(true);

    await fs.remove(distDir);
  });
});
