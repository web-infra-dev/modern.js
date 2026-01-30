import path from 'node:path';
import { SERVICE_WORKER_ENVIRONMENT_NAME } from '@modern-js/builder';
import type { RsbuildPlugin, RspackChain } from '@rsbuild/core';
import type { BuilderOptions } from '../types';

export const builderPluginAdapterBasic = (
  options: BuilderOptions,
): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-modern-basic',

  setup(api) {
    api.modifyBundlerChain((chain, { target, CHAIN_ID, environment }) => {
      const isServiceWorker =
        environment.name === SERVICE_WORKER_ENVIRONMENT_NAME;

      // apply node compat
      if (target === 'node' || isServiceWorker) {
        applyNodeCompat(isServiceWorker, chain);
      }

      if (target === 'web' && !isServiceWorker) {
        const bareServerModuleReg = /\.(server|node)\.[tj]sx?$/;
        const depExt = process.env.MODERN_LIB_FORMAT === 'esm' ? 'mjs' : 'js';
        chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(bareServerModuleReg);
        chain.module
          .rule('bare-server-module')
          .test(bareServerModuleReg)
          .use('server-module-loader')
          .loader(
            path.join(__dirname, `../loaders/serverModuleLoader.${depExt}`),
          );
      }

      const { appContext } = options;
      const { metaName } = appContext;

      chain.watchOptions({
        ignored: [
          `[\\\\/](?:node_modules(?![\\\\/]\\.${metaName})|.git)[\\\\/]`,
        ],
      });
    });

    // Use modifyRspackConfig to ensure extensionAlias has higher priority than rsbuild defaults
    api.modifyRspackConfig((config, { target, environment }) => {
      const isServiceWorker =
        environment.name === SERVICE_WORKER_ENVIRONMENT_NAME;

      if (target === 'node' || isServiceWorker) {
        // Define extensionAlias for server and node files
        // a .mjs file will resolve in order of .node.mjs, .server.mjs, .mjs
        const extensionAlias: Record<string, string[]> = {
          '.js': ['.node.js', '.server.js', '.js'],
          '.jsx': ['.node.jsx', '.server.jsx', '.jsx'],
          '.ts': ['.node.ts', '.server.ts', '.ts'],
          '.tsx': ['.node.tsx', '.server.tsx', '.tsx'],
          '.mjs': ['.node.mjs', '.server.mjs', '.mjs'],
          '.json': ['.node.json', '.server.json', '.json'],
        };

        config.resolve ??= {};
        config.resolve.extensionAlias = {
          ...config.resolve.extensionAlias,
          ...extensionAlias,
        };
      }
    });
  },
});

/** compat some config, if target is `node` or `worker` */
function applyNodeCompat(isServiceWorker: boolean, chain: RspackChain) {
  const nodeExts = [
    '.node.js',
    '.node.jsx',
    '.node.ts',
    '.node.tsx',
    '.node.mjs',
    '.server.js',
    '.server.jsx',
    '.server.ts',
    '.server.tsx',
    '.server.mjs',
  ];
  const webWorkerExts = [
    '.worker.js',
    '.worker.jsx',
    '.worker.ts',
    '.worker.tsx',
  ];
  // apply node resolve extensions
  for (const ext of nodeExts) {
    chain.resolve.extensions.prepend(ext);
  }

  if (isServiceWorker) {
    for (const ext of webWorkerExts) {
      chain.resolve.extensions.prepend(ext);
    }
  }
}
