import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import { builtinMappingResolved } from '@rsbuild/plugin-node-polyfill';

export type BuiltinModules = keyof typeof builtinMappingResolved;

export const createNodePolyfill = (polyfill: Array<BuiltinModules>) => {
  const plugin: RsbuildPlugin = {
    name: 'edge-node-polyfill',
    setup(api) {
      api.modifyBundlerChain(async (chain, { isServer }) => {
        const o = Object.fromEntries(
          polyfill.map(moduleName => [
            moduleName,
            builtinMappingResolved[moduleName]!,
          ]),
        );
        console.log('add fallback', o);
        chain.resolve.fallback.merge(o);
      });

      api.modifyRspackConfig(config => {
        console.log('rspack config', config);
      });
    },
  };
  return plugin;
};

export const createNodeSchemaPlugin = (polyfill: Array<BuiltinModules>) => {
  // make a rspack plugin to redirect "node:" prefix request to polyfill
  const plugin: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.compilation.tap(
        'ESANodeModulePlugin',
        (_, { normalModuleFactory }) => {
          normalModuleFactory.hooks.resolveForScheme
            .for('node')
            .tap('ESANodeModulePlugin', resourceData => {
              const name = resourceData.resource.replace(/^node:/, '');
              if (polyfill.includes(name as BuiltinModules)) {
                resourceData.path =
                  builtinMappingResolved[name as BuiltinModules]!;
              }
            });
        },
      );
    },
  };
  return plugin;
};
