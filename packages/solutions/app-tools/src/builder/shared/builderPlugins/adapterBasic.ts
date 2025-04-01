import path from 'path';
import { SERVICE_WORKER_ENVIRONMENT_NAME } from '@modern-js/uni-builder';
import type { RsbuildPlugin, RspackChain } from '@rsbuild/core';
import type { Bundler } from '../../../types';
import type { BuilderOptions } from '../types';

export const builderPluginAdapterBasic = <B extends Bundler>(
  options: BuilderOptions<B>,
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
        chain.module
          .rule('bare-server-module')
          .test(bareServerModuleReg)
          .use('server-module-loader')
          .loader(require.resolve('../loaders/serverModuleLoader'));
      }

      const { appContext } = options;
      const { metaName } = appContext;

      // compat modern-js v1
      // this helps symlinked packages to resolve packages correctly, such as `react/jsx-runtime`.
      chain.resolve.modules
        .add('node_modules')
        .add(path.join(api.context.rootPath, 'node_modules'));

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
    '.server.js',
    '.server.jsx',
    '.server.ts',
    '.server.tsx',
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
