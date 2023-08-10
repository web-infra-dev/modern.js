import { merge as deepMerge } from '@modern-js/utils/lodash';
import { VueLoaderPlugin } from 'vue-loader';
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { VueLoaderOptions } from 'vue-loader';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

export type PluginVueOptions = {
  vueJsxOptions?: VueJSXPluginOptions;
  vueLoaderOptions?: VueLoaderOptions;
};

export function builderPluginVue(
  options: PluginVueOptions = {},
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-vue',

    // Remove built-in react plugins.
    // These plugins should be moved to a separate package in the next major version.
    remove: [
      'builder-plugin-react',
      'builder-plugin-antd',
      'builder-plugin-arco',
    ],

    async setup(api) {
      api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
        return mergeBuilderConfig(config, {
          output: {
            disableSvgr: true,
          },
          source: {
            define: {
              // https://link.vuejs.org/feature-flags
              __VUE_OPTIONS_API__: true,
              __VUE_PROD_DEVTOOLS__: false,
            },
          },
          tools: {
            babel(_, { addPlugins }) {
              addPlugins([
                [
                  require.resolve('@vue/babel-plugin-jsx'),
                  options.vueJsxOptions || {},
                ],
              ]);
            },
          },
        });
      });

      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

        const vueLoaderOptions = deepMerge(
          {
            compilerOptions: {
              preserveWhitespace: false,
            },
            experimentalInlineMatchResource:
              api.context.bundlerType === 'rspack',
          },
          options.vueLoaderOptions,
        );

        chain.module
          .rule(CHAIN_ID.RULE.VUE)
          .test(/\.vue$/)
          .use(CHAIN_ID.USE.VUE)
          .loader(require.resolve('vue-loader'))
          .options(vueLoaderOptions);

        chain.plugin(CHAIN_ID.PLUGIN.VUE_LOADER_PLUGIN).use(VueLoaderPlugin);
      });
    },
  };
}
