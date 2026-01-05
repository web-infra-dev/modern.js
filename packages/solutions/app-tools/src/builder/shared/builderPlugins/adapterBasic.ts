import path from 'path';
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

      if (target === 'web') {
        const bareServerModuleReg = /\.(server|node)\.[tj]sx?$/;
        chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(bareServerModuleReg);
        const ext = process.env.MODERN_LIB_FORMAT === 'esm' ? 'mjs' : 'js';
        chain.module
          .rule('bare-server-module')
          .test(bareServerModuleReg)
          .use('server-module-loader')
          .loader(path.join(__dirname, `../loaders/serverModuleLoader.${ext}`));
      }

      const { appContext } = options;
      const { metaName } = appContext;

      chain.watchOptions({
        ignored: [
          `[\\\\/](?:node_modules(?![\\\\/]\\.${metaName})|.git)[\\\\/]`,
        ],
      });
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

  const extensionAlias = {
    '.js': ['.node.js', '.server.js', '.js'],
    '.jsx': ['.node.jsx', '.server.jsx', '.jsx'],
    '.ts': ['.node.ts', '.server.ts', '.ts'],
    '.tsx': ['.node.tsx', '.server.tsx', '.tsx'],
    '.mjs': ['.node.mjs', '.server.mjs', '.mjs'],
    '.json': ['.node.json', '.server.json', '.json'],
  };

  // At present, it is mainly for the scene of async_storage and consistent with resolve.extensions
  chain.resolve.extensionAlias.merge(extensionAlias);
}
