import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { getBabelHook } from '@modern-js/plugin-module-babel';

export type Options = {
  targets?: Record<string, string> | string;
};

export const getPolyfillHook = (options?: Options) => {
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
  return getBabelHook({
    plugins,
  });
};

export const modulePluginPolyfill = (
  options?: Options,
): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-polyfill',
  setup: () => ({
    beforeBuildTask(config) {
      config.hooks.push(getPolyfillHook(options));
      return config;
    },
  }),
});

/**
 * deprecated named export
 * @deprecated
 */
export const ModulePolyfillPlugin = modulePluginPolyfill;
