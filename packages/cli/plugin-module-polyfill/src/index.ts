import path from 'path';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { babelPlugin } from '@modern-js/libuild-plugin-babel';

export const ModulePolyfillPlugin = (options: {
  targets?: Record<string, string> | string;
}): CliPlugin<ModuleTools> => ({
  name: 'module-polyfill',
  setup: () => ({
    modifyLibuild(config) {
      const plugins = [
        [require('@babel/plugin-syntax-jsx')],
        [
          require('babel-plugin-polyfill-corejs3'),
          {
            method: 'usage-pure',
            absoluteImports: path.dirname(
              require.resolve('core-js-pure/package.json', {
                paths: [__dirname],
              }),
            ),
            targets: options.targets,
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
