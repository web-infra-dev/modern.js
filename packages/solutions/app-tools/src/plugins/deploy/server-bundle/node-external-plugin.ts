import type { Rspack } from '@rsbuild/core';
import { NODE_BUILTIN_MODULES } from './constant';

export const nodeExternalPlugin: Rspack.RspackPluginInstance = {
  name: 'node-external',
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'NodeExternalPlugin',
      (_, { normalModuleFactory }) => {
        normalModuleFactory.hooks.factorize.tap(
          'NodeExternalPlugin',
          resourceData => {
            if (NODE_BUILTIN_MODULES.includes(resourceData.request)) {
              console.log('factorize', resourceData);
            }
          },
        );
        normalModuleFactory.hooks.resolveForScheme
          .for('node')
          .tap('NodeExternalPlugin', resourceData => {
            console.log('resolveForScheme', resourceData);
          });
      },
    );
  },
};
