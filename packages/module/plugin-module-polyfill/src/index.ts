import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { getBabelHook } from '@modern-js/plugin-module-babel';

export const modulePluginPolyfill = (options?: {
  targets?: Record<string, string> | string;
}): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-polyfill',
  setup: () => ({
    beforeBuildTask(config) {
      const plugins = [
        [require('@babel/plugin-syntax-typescript'), { isTSX: true }],
        [require('@babel/plugin-syntax-jsx')],
        [
          require('babel-plugin-polyfill-corejs3'),
          {
            method: 'usage-pure',
            targets: options?.targets,
          },
        ],
      ];
      config.hooks.push(
        getBabelHook({
          plugins,
        }),
      );
      return config;
    },
  }),
});

/**
 * deprecated named export
 * @deprecated
 */
export const ModulePolyfillPlugin = modulePluginPolyfill;
