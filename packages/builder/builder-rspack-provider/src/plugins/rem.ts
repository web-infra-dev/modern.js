import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';
import {
  getDistPath,
  AutoSetRootFontSizePlugin,
  type RemOptions,
} from '@modern-js/builder-shared';

const defaultOptions: RemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export const builderPluginRem = (): BuilderPlugin => ({
  name: 'builder-plugin-rem',

  pre: [
    'builder-plugin-css',
    'builder-plugin-less',
    'builder-plugin-sass',
    'builder-plugin-stylus',
  ],

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isServer, isWebWorker }) => {
        const config = api.getNormalizedConfig();
        const {
          output: { convertToRem },
        } = config;

        if (!convertToRem || isServer || isWebWorker) {
          return;
        }

        const userOptions = {
          ...defaultOptions,
          ...(typeof convertToRem === 'boolean' ? {} : convertToRem),
        };

        // handle css
        const applyRules = [
          CHAIN_ID.RULE.CSS,
          CHAIN_ID.RULE.LESS,
          CHAIN_ID.RULE.SASS,
          CHAIN_ID.RULE.STYLUS,
        ];

        // Deep copy options to prevent unexpected behavior.
        applyRules.forEach(name => {
          chain.module.rules.has(name) &&
            chain.module
              .rule(name)
              .use(CHAIN_ID.USE.POSTCSS)
              .tap((options = {}) => ({
                ...options,
                pxToRem: {
                  rootValue: userOptions.rootFontSize,
                  unitPrecision: 5,
                  propList: ['*'],
                  ..._.cloneDeep(userOptions.pxtorem || {}),
                },
              }));
        });

        // handle runtime (html)
        if (!userOptions.enableRuntime) {
          return;
        }

        const { default: HTMLRspackPlugin } = await import(
          '@rspack/plugin-html'
        );

        const entries = Object.keys(chain.entryPoints.entries() || {});
        const distDir = getDistPath(config.output, 'js');

        chain
          .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
          .use(AutoSetRootFontSizePlugin, [
            userOptions,
            entries,
            HTMLRspackPlugin as any,
            distDir,
          ]);
      },
    );
  },
});
