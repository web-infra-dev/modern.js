import type { BuilderPlugin } from '../types';
import { isUsingHMR } from '@modern-js/builder-shared';
// @ts-expect-error
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  pre: ['builder-plugin-swc'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
      const config = api.getNormalizedConfig();
      const usingHMR = isUsingHMR(config, { isProd, target });
      const { isBeyondReact17 } = await import('@modern-js/utils');
      const isNewJsx = isBeyondReact17(api.context.rootPath);

      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.SWC)
        .tap(options => {
          options.jsc.transform.react = {
            development: !isProd,
            refresh: usingHMR,
            runtime: isNewJsx ? 'automatic' : 'classic',
          };
          return options;
        });

      if (!usingHMR) {
        return;
      }

      chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).use(ReactRefreshPlugin, [
        {
          // todo: Consistent with swc-loader rules
          include: [],
          exclude: [],
        },
      ]);
    });
  },
});
