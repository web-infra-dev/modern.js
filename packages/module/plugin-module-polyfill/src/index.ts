import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { babelPlugin } from '@modern-js/libuild-plugin-babel';

// deprecated named export
export const ModulePolyfillPlugin = (options?: {
  targets?: Record<string, string> | string;
}): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-polyfill',
  setup: () => ({
    modifyLibuild(config) {
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
      config.plugins?.push(
        babelPlugin({
          plugins,
        }),
      );
      return config;
    },
  }),
});

// right named export
export { ModulePolyfillPlugin as modulePluginPolyfill };
