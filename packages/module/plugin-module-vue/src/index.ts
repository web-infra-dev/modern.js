import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import vuePlugin from 'esbuild-plugin-vue3';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

export const modulePluginVue = (options?: {
  vueJsxPluginOptions?: VueJSXPluginOptions;
}): CliPlugin<ModuleTools> => ({
  name: 'vue-plugin',
  usePlugins: [
    modulePluginBabel({
      plugins: [
        [require('@babel/plugin-syntax-typescript'), { isTSX: true }],
        [
          require('@vue/babel-plugin-jsx'),
          {
            ...options?.vueJsxPluginOptions,
          },
        ],
      ],
    }),
  ],
  setup: () => ({
    beforeBuildTask(config) {
      const lastEsbuildOptions = config.esbuildOptions;
      config.esbuildOptions = c => {
        const lastEsbuildConfig = lastEsbuildOptions(c);
        lastEsbuildConfig.plugins?.unshift(vuePlugin() as any);
        return lastEsbuildConfig;
      };
      config.jsx = 'preserve';
      return config;
    },
  }),
});
