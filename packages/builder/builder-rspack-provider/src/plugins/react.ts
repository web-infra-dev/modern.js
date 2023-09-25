import type { BuilderPlugin } from '../types';
import { isUsingHMR } from '@modern-js/builder-shared';
// @ts-expect-error
import ReactRefreshRspackPlugin from '@rspack/plugin-react-refresh';

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  pre: ['builder-plugin-swc'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
      const config = api.getNormalizedConfig();
      const usingHMR = isUsingHMR(config, { isProd, target });
      const { isBeyondReact17 } = await import('@modern-js/utils');
      const isNewJsx = isBeyondReact17(api.context.rootPath);

      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      const reactOptions = {
        development: !isProd,
        refresh: usingHMR,
        runtime: isNewJsx ? 'automatic' : 'classic',
      };

      // runtimePaths.forEach((condition: string) => {
      //   rule.exclude.add(condition);
      // });

      rule.use(CHAIN_ID.USE.SWC).tap(options => {
        options.jsc.transform.react = {
          ...reactOptions,
        };
        return options;
      });

      if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .use(CHAIN_ID.USE.SWC)
          .tap(options => {
            options.jsc.transform.react = {
              ...reactOptions,
            };
            return options;
          });
      }

      if (!usingHMR) {
        return;
      }

      chain
        .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
        .use(ReactRefreshRspackPlugin, [
          {
            // consistent with swc-loader rules
            // include: [
            //   {
            //     and: [api.context.rootPath, { not: /\/node_modules\// }],
            //   },
            //   ...(config.source.include || []),
            // ],
            exclude: config.source.exclude || null,
          },
        ]);
    });
  },
});
