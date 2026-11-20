import { createRequire } from 'node:module';
import path from 'node:path';
const root =
  process.env.MF_RSC_BASELINE ||
  path.resolve(import.meta.dirname, '../../../..');
const require = createRequire(
  path.join(root, 'packages/cli/builder/package.json'),
);
const { pluginReact } = await import(require.resolve('@rsbuild/plugin-react'));
const { pluginRSC, Layers } = await import(
  require.resolve('rsbuild-plugin-rsc')
);
const mfRequire = createRequire(
  path.join(root, 'packages/cli/plugin-module-federation/package.json'),
);
const { ModuleFederationPlugin } = mfRequire(
  '@module-federation/enhanced/rspack',
);
const version = process.env.PROBE_VERSION || 'v1';
const dist = process.env.MF_RSC_PROBE_DIST || './dist';
export default {
  mode: 'production',
  resolve: {
    alias: {
      '@module-federation/enhanced/runtime': mfRequire.resolve(
        '@module-federation/enhanced/runtime',
      ),
      '@probe/service-fetch': path.resolve(
        root,
        '../core/packages/bridge/bridge-react/src/service/fetch.ts',
      ),
    },
  },
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .add(path.join(root, 'tests/integration/rsc-ssr-app/node_modules'))
        .add(
          path.join(
            root,
            'tests/integration/module-federation/provider/node_modules',
          ),
        )
        .add('node_modules');
    },
  },
  plugins: [pluginReact(), pluginRSC({ layers: { ssr: /entry\.ssr\.tsx$/ } })],
  source: { define: { 'process.env.PROBE_VERSION': JSON.stringify(version) } },
  output: { cleanDistPath: true },
  environments: {
    server: {
      source: {
        entry: { index: { import: './entry.rsc.tsx', layer: Layers.rsc } },
      },
      output: { distPath: { root: `${dist}/${version}/server` } },
      tools: {
        rspack(config) {
          config.output.module = false;
          config.output.chunkFormat = 'commonjs';
          config.output.library = { type: 'commonjs2' };
          config.experiments = { ...config.experiments, outputModule: false };
        },
      },
    },
    client: {
      source: { entry: { index: './host.ts' } },
      output: {
        assetPrefix: `/${version}/`,
        distPath: { root: `${dist}/${version}/client` },
      },
      tools: {
        rspack(config) {
          config.output.uniqueName = `rsc-probe-${version}`;
          config.output.chunkLoadingGlobal = `rsc_probe_chunks_${version}`;
          config.plugins.push(
            new ModuleFederationPlugin({
              name: `rsc_probe_${version}`,
              filename: 'remoteEntry.js',
              exposes: { './client': './client.tsx' },
              shared: {},
              dts: false,
            }),
          );
        },
      },
    },
  },
};
