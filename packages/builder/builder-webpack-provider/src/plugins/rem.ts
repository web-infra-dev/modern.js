import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';
import {
  RemOptions,
  PxToRemOptions,
  AutoSetRootFontSizePlugin,
} from '@modern-js/builder-shared';

const defaultOptions: RemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export const builderPluginRem = (): BuilderPlugin => ({
  name: 'builder-plugin-rem',

  setup(api) {
    api.modifyWebpackChain(
      async (chain, { CHAIN_ID, isServer, isWebWorker }) => {
        const {
          output: { convertToRem },
        } = api.getNormalizedConfig();

        if (!convertToRem || isServer || isWebWorker) {
          return;
        }

        const userOptions = {
          ...defaultOptions,
          ...(typeof convertToRem === 'boolean' ? {} : convertToRem),
        };

        // handle css
        const { default: PxToRemPlugin } = (await import(
          '../../compiled/postcss-pxtorem'
        )) as {
          default: (_opts: PxToRemOptions) => any;
        };

        const { default: HtmlWebpackPlugin } = await import(
          'html-webpack-plugin'
        );

        const applyRules = [
          CHAIN_ID.RULE.CSS,
          CHAIN_ID.RULE.LESS,
          CHAIN_ID.RULE.SASS,
          CHAIN_ID.RULE.STYLUS,
        ];
        const getPxToRemPlugin = () =>
          PxToRemPlugin({
            rootValue: userOptions.rootFontSize,
            unitPrecision: 5,
            propList: ['*'],
            ..._.cloneDeep(userOptions.pxtorem || {}),
          });
        // Deep copy options to prevent unexpected behavior.
        applyRules.forEach(name => {
          chain.module.rules.has(name) &&
            chain.module
              .rule(name)
              .use(CHAIN_ID.USE.POSTCSS)
              .tap((options = {}) => ({
                ...options,
                postcssOptions: {
                  ...(options.postcssOptions || {}),
                  plugins: [
                    ...(options.postcssOptions?.plugins || []),
                    getPxToRemPlugin(),
                  ],
                },
              }));
        });

        // handle runtime (html)
        if (!userOptions.enableRuntime) {
          return;
        }

        const entries = Object.keys(chain.entryPoints.entries() || {});

        chain
          .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
          .use(AutoSetRootFontSizePlugin, [
            userOptions,
            entries,
            HtmlWebpackPlugin,
          ]);
      },
    );
  },
});
