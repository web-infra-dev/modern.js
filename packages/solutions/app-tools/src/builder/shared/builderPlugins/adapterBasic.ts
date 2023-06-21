import { BuilderPlugin, BundlerChain } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '../types';

export const builderPluginAdapterBasic =
  (): BuilderPlugin<BuilderPluginAPI> => ({
    name: 'builder-plugin-adapter-modern-basic',

    setup(api) {
      api.modifyBundlerChain((chain, { target, CHAIN_ID }) => {
        // set bundler config name
        if (target === 'node') {
          chain.name('server');
        } else if (target === 'service-worker') {
          chain.name('service-worker');
        } else if (target === 'web-worker') {
          chain.name('worker');
        } else if (target === 'modern-web') {
          chain.name('modern');
        } else {
          chain.name('client');
        }

        // apply node compat
        if (target === 'node' || target === 'service-worker') {
          applyNodeCompat(target, chain);
        }

        if (target === 'web' || target === 'modern-web') {
          const bareServerModuleReg = /\.(server|node)\.[tj]sx?$/;
          chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(bareServerModuleReg);
          chain.module
            .rule('bare-server-module')
            .test(bareServerModuleReg)
            .use('server-module-loader')
            .loader(require.resolve('../loaders/serverModuleLoader'));
        }
      });
    },
  });

/** compat some config, if target is `node` or `worker` */
function applyNodeCompat(
  target: 'node' | 'service-worker',
  chain: BundlerChain,
) {
  const nodeExts = [
    '.node.js',
    '.node.jsx',
    '.node.ts',
    '.node.tsx',
    '.server.js',
    '.server.ts',
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

  if (target === 'service-worker') {
    for (const ext of webWorkerExts) {
      chain.resolve.extensions.prepend(ext);
    }
  }
}
