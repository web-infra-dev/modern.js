import { appTools, defineConfig } from '@modern-js/app-tools';

const buildKind = process.env.ASYNC_CHUNK_RUNTIME_BUILD || 'unified';
const buildPublicPath =
  buildKind === 'unified'
    ? 'http://localhost:4331/'
    : `http://localhost:4331/${buildKind}/`;
const buildDistPath = buildKind === 'unified' ? 'dist' : `dist/${buildKind}`;

export default defineConfig({
  server: {
    port: 4331,
  },
  source: {
    transformImport: false,
  },
  output: {
    disableTsChecker: true,
    distPath: {
      root: buildDistPath,
    },
  },
  performance: {
    buildCache: false,
  },
  tools: {
    bundlerChain(chain) {
      chain.output.uniqueName('ad_rivendell_dev');
      chain.output.chunkLoadingGlobal('webpackChunk_ad_rivendell_dev');
      chain.output.chunkFilename('static/js/async/[id].[contenthash:8].js');
      chain.optimization.chunkIds('deterministic');
      chain.optimization.moduleIds('deterministic');
      chain.optimization.runtimeChunk(false);
      chain.optimization.splitChunks({
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      });
    },
    rspack(config, { rspack }) {
      config.output.publicPath = buildPublicPath;
      config.plugins.push(
        new rspack.DefinePlugin({
          __ASYNC_CHUNK_RUNTIME_BUILD__: JSON.stringify(buildKind),
        }),
      );
      config.plugins.push(
        new rspack.container.ModuleFederationPlugin({
          name: 'asyncChunkRuntimeProvider',
          filename: 'remoteEntry.js',
          exposes: {
            './RemotePanel': './src/RemotePanel.tsx',
          },
          manifest: true,
          // shared: {
          //   react: { singleton: true, import: false },
          //   'react-dom': {
          //     singleton: true,
          //     import: false,
          //   },
          // },
        }),
      );

      config.output.library = {
        type: 'umd',
      };
      config.externals = {
        react: 'react',
        'react-dom': 'react-dom',
      };
      config.externalsType = 'global';
      config.output.globalObject = 'window';
    },
  },
  plugins: [appTools()],
});
