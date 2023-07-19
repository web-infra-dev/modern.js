import { merge as deepMerge } from '@modern-js/utils/lodash';
import { VueLoaderPlugin } from 'vue-loader';
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { SharedBuilderConfig } from '@modern-js/builder-shared';
import type { VueLoaderOptions } from 'vue-loader';

type VueJSXPresetOptions = {
  compositionAPI?: boolean | string;
  functional?: boolean;
  injectH?: boolean;
  vModel?: boolean;
  vOn?: boolean;
};

export type PluginVueOptions = {
  vueJsxOptions?: VueJSXPresetOptions;
  vueLoaderOptions?: VueLoaderOptions;
};

export function builderPluginVue2(
  options: PluginVueOptions = {},
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-vue2',

    // Remove built-in react plugins.
    // These plugins should be moved to a separate package in the next major version.
    remove: [
      'builder-plugin-react',
      'builder-plugin-antd',
      'builder-plugin-arco',
    ],

    async setup(api) {
      api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
        const builderConfig: SharedBuilderConfig = {
          output: {
            disableSvgr: true,
          },
          tools: {
            babel(_, { addPresets }) {
              addPresets([
                [
                  require.resolve('@vue/babel-preset-jsx'),
                  {
                    injectH: true,
                    ...options.vueJsxOptions,
                  },
                ],
              ]);
            },
          },
        };

        // When using Rspack with Vue2, css extract is not supported,
        // so we need to use style-loader to handle styles
        // ref: https://www.rspack.dev/guide/vue.html#vue2
        if (api.context.bundlerType === 'rspack') {
          builderConfig.output!.disableCssExtract = true;
        }

        return mergeBuilderConfig(config, builderConfig);
      });

      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

        const vueLoaderOptions = deepMerge(
          {
            compilerOptions: {
              preserveWhitespace: false,
            },
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
