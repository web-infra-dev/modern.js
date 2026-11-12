import path from 'path';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { describe, expect, it, rs } from '@rstest/core';
import { BridgeSSRPlugin } from './BridgeSSRPlugin';
import { createDevManifestPublication } from './devManifest';

const nodeRequire = createRequire(__filename);

const rspack = nodeRequire('@rspack/core') as typeof import('@rspack/core');
const { ModuleFederationPlugin } = nodeRequire(
  '@module-federation/enhanced/rspack',
) as typeof import('@module-federation/enhanced/rspack');

const createPluginHarness = async (overrides: Record<string, unknown> = {}) => {
  const { moduleFederationSSRPlugin } = await import('./ssrPlugin');
  const pluginOptions = {
    assetFileNames: {},
    assetResources: {},
    csrConfig: {},
    distOutputDir: '/project/dist',
    fetchServerQuery: undefined,
    secondarySharedTreeShaking: false,
    ssrConfig: {},
    userConfig: {
      ssr: {
        distOutputDir: '/project/dist/bundles',
      },
    },
    ...overrides,
  } as any;

  let rsbuildPlugin: any;
  const api = {
    _internalRuntimePlugins: rs.fn(),
    _internalServerPlugins: rs.fn(),
    config: rs.fn(callback => {
      const config = callback();
      rsbuildPlugin = config.builderPlugins[0];
    }),
    getAppContext: rs.fn(() => ({ bundlerType: 'rspack' })),
    getConfig: rs.fn(() => ({ server: { ssr: true } })),
    modifyBundlerChain: rs.fn(),
    onAfterBuild: rs.fn(),
    onDevCompileDone: rs.fn(),
  };

  await moduleFederationSSRPlugin(pluginOptions).setup!(api as any);

  const rsbuildApi = {
    getNormalizedConfig: () => ({ dev: { hmr: true } }),
    modifyEnvironmentConfig: rs.fn(),
    modifyRspackConfig: rs.fn(),
    processAssets: rs.fn(),
    onAfterCreateCompiler: rs.fn(),
    onBeforeDevCompile: rs.fn(),
    onDevCompileDone: rs.fn(),
  };

  rsbuildPlugin.setup(rsbuildApi);

  const modifyEnvironmentConfig =
    rsbuildApi.modifyEnvironmentConfig.mock.calls[0][0];
  modifyEnvironmentConfig(
    {
      output: {
        distPath: { root: '/project/dist' },
        target: 'web',
      },
    },
    { name: 'web' },
  );
  modifyEnvironmentConfig(
    {
      output: {
        distPath: { root: '/project/dist/bundles' },
        target: 'node',
      },
    },
    { name: 'node' },
  );

  return { rsbuildApi, api, pluginOptions };
};

const runCompiler = (config: import('@rspack/core').Configuration) =>
  new Promise<void>((resolve, reject) => {
    const compiler = rspack.rspack(config);
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ all: false, errors: true })));
        return;
      }
      compiler.close(closeErr => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve();
      });
    });
  });

describe('moduleFederationSSRPlugin', () => {
  it.each([false, true])(
    'publishes ready builds with matching browser capability (Service: %s)',
    async service => {
      rs.stubEnv('NODE_ENV', 'development');
      const outputDir = await mkdtemp(path.join(tmpdir(), 'mf-ready-'));
      try {
        const identity = createDevManifestPublication();
        const { rsbuildApi, api, pluginOptions } = await createPluginHarness({
          csrConfig: {
            getPublicPath: 'function() { return globalThis.assetBase; }',
          },
          devManifestPublication: identity,
          distOutputDir: outputDir,
        });
        const callbacks: Record<string, (...args: any[]) => void> = {};
        const compiler = {
          hooks: Object.fromEntries(
            ['invalid', 'thisCompilation'].map(name => [
              name,
              {
                tap: (_: unknown, callback: (...args: any[]) => void) => {
                  callbacks[name] = callback;
                },
              },
            ]),
          ),
        };
        rsbuildApi.onAfterCreateCompiler.mock.calls[0][0]({ compiler });
        const compilation = {};
        callbacks.thisCompilation(compilation);
        const stats = { compilation, hasErrors: () => false };
        const config = { output: { publicPath: 'auto' } };
        expect(
          rsbuildApi.modifyRspackConfig.mock.calls[0][0](config, {
            environment: { name: 'node' },
          }),
        ).toBe(config);
        expect(config).toEqual({ output: { publicPath: 'auto' } });
        const json = JSON.stringify({
          metaData: { buildInfo: { buildVersion: 'completed-build' } },
          exposes: [
            {
              name: 'App',
              ...(service ? { servicePath: '/service/App' } : {}),
            },
          ],
        });
        for (const name of ['web', 'node']) {
          rsbuildApi.processAssets.mock.calls[0][1]({
            environment: { name },
            assets: {
              'mf-manifest.json': { source: () => json },
              'mf-stats.json': { source: () => json },
            },
          });
        }
        await api.onDevCompileDone.mock.calls[0][0]({ stats });
        rsbuildApi.onDevCompileDone.mock.calls[0][0].handler({ stats });
        expect(identity.isReadyFor(stats)).toBe(true);
        expect(pluginOptions.devManifestReady).toBe(true);
        const publication = rs.fn();
        const unsubscribe = identity.subscribe(publication);
        expect(publication).toHaveBeenLastCalledWith({
          buildVersion: 'completed-build',
          hot: !service,
        });
        unsubscribe();
        callbacks.invalid();
        expect(identity.isReadyFor(stats)).toBe(false);
        expect(pluginOptions.devManifestReady).toBe(false);
      } finally {
        await rm(outputDir, { recursive: true, force: true });
        rs.unstubAllEnvs();
      }
    },
  );

  it('bundles one SSR context for consumer and plugin package copies across import and require', async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), 'mf-context-copies-'));
    const consumer = path.join(outputDir, 'consumer/bridge-react/dist');
    const plugin = path.join(outputDir, 'plugin/bridge-react/dist');
    try {
      await mkdir(consumer, { recursive: true });
      await mkdir(plugin, { recursive: true });
      await writeFile(
        path.join(consumer, 'ssr.es.js'),
        'export const BridgeSSRContext = {};',
      );
      await writeFile(
        path.join(plugin, 'ssr.cjs.js'),
        'exports.BridgeSSRContext = {};',
      );
      await writeFile(
        path.join(consumer, 'consumer.js'),
        "export { BridgeSSRContext } from './ssr.es.js';",
      );
      await writeFile(
        path.join(plugin, 'consumer.js'),
        "module.exports = require('./ssr.cjs.js');",
      );
      await writeFile(
        path.join(outputDir, 'entry.js'),
        `import { BridgeSSRContext } from '@module-federation/bridge-react/ssr';
import { BridgeSSRContext as consumer } from './consumer/bridge-react/dist/consumer.js';
const plugin = require('./plugin/bridge-react/dist/consumer.js');
export const same = consumer === BridgeSSRContext && consumer === plugin.BridgeSSRContext;`,
      );
      await runCompiler({
        mode: 'development',
        context: outputDir,
        target: 'node',
        entry: './entry.js',
        devtool: false,
        output: {
          path: path.join(outputDir, 'dist'),
          filename: 'entry.js',
          library: { type: 'commonjs-module' },
        },
        plugins: [
          new BridgeSSRPlugin('modern-js', path.join(consumer, 'ssr.es.js')),
        ],
      });
      expect(nodeRequire(path.join(outputDir, 'dist/entry.js')).same).toBe(
        true,
      );
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it('emits the configured public path for Node HTTP chunk loading without changing browser runtimes', async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), 'mf-ssr-runtime-path-'),
    );
    try {
      await writeFile(
        path.join(outputDir, 'entry.js'),
        "module.exports = () => import('./chunk.js');",
      );
      await writeFile(path.join(outputDir, 'chunk.js'), 'module.exports = 42;');
      const { rsbuildApi } = await createPluginHarness();
      const modifyRspackConfig = rsbuildApi.modifyRspackConfig.mock.calls[0][0];
      const browserConfig = {
        output: { publicPath: 'https://cdn.example.com/app/' },
      };
      modifyRspackConfig(browserConfig, { environment: { name: 'web' } });
      expect(browserConfig).toEqual({
        output: { publicPath: 'https://cdn.example.com/app/' },
      });

      const config: import('@rspack/core').Configuration = {
        mode: 'development',
        context: outputDir,
        target: 'async-node',
        entry: './entry.js',
        devtool: false,
        output: {
          path: path.join(outputDir, 'dist'),
          filename: 'entry.js',
          chunkLoading: 'async-node',
          publicPath: 'https://cdn.example.com/app/',
        },
      };
      modifyRspackConfig(config, { environment: { name: 'node' } });
      await runCompiler(config);
      const output = await readFile(
        path.join(outputDir, 'dist/entry.js'),
        'utf8',
      );
      expect(output).toContain(
        '__webpack_require__.p = "https://cdn.example.com/app/bundles/"',
      );
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it('keeps SSR JavaScript under bundles while asset/resource URLs use the browser static path', async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), 'modern-js-v3-ssr-public-path-'),
    );
    const sourceDir = path.join(outputDir, 'src');
    const browserPublicPath = 'https://cdn.example.com/app/';
    const ssrPublicPath = `${browserPublicPath}bundles/`;

    try {
      await mkdir(sourceDir, { recursive: true });
      await writeFile(
        path.join(sourceDir, 'asset.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" /></svg>',
      );
      await writeFile(
        path.join(sourceDir, 'asset.ts'),
        "import assetUrl from './asset.svg';\nexport default assetUrl;\n",
      );

      const { rsbuildApi } = await createPluginHarness();
      const config: import('@rspack/core').Configuration = {
        mode: 'production',
        context: outputDir,
        target: 'async-node',
        entry: {},
        output: {
          path: path.join(outputDir, 'dist', 'bundles'),
          filename: '[name].js',
          chunkFilename: '[name].js',
          chunkFormat: 'commonjs',
          chunkLoading: 'async-node',
          library: { type: 'commonjs-module' },
          publicPath: browserPublicPath,
          uniqueName: 'remote',
        },
        module: {
          rules: [
            {
              test: /\.svg$/,
              type: 'asset/resource',
              generator: {
                filename: 'static/svg/[name].[contenthash][ext]',
              },
            },
          ],
        },
        plugins: [
          new ModuleFederationPlugin({
            name: 'remote',
            filename: 'remote.js',
            exposes: {
              './Asset': './src/asset.ts',
            },
            library: { type: 'commonjs-module' },
            manifest: false,
          }),
        ],
      };

      const modifyRspackConfig = rsbuildApi.modifyRspackConfig.mock.calls[0][0];
      modifyRspackConfig(config, { environment: { name: 'node' } });

      expect(config.output?.publicPath).toBe(ssrPublicPath);
      expect(config.module?.generator?.asset?.publicPath).toBe(
        browserPublicPath,
      );
      expect(config.module?.generator?.['asset/resource']?.publicPath).toBe(
        browserPublicPath,
      );

      await runCompiler(config);

      const remote = nodeRequire(
        path.join(outputDir, 'dist', 'bundles', 'remote.js'),
      ) as {
        get: (expose: string) => Promise<() => { default: string }>;
      };
      const factory = await remote.get('./Asset');
      const exposedModule = factory();

      expect(exposedModule.default).toMatch(
        /^https:\/\/cdn\.example\.com\/app\/static\/svg\/asset\.[^.]+\.svg$/,
      );
      expect(exposedModule.default).not.toContain('/bundles/static/');
    } finally {
      await rm(outputDir, { force: true, recursive: true });
    }
  });
});
