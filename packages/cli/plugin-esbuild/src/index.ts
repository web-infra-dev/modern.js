import type { CliPlugin } from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { ESBuildPlugin } from './esbuild-webpack-plugin';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-esbuild',

  setup: api => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-esbuild'];
    },
    config() {
      return {
        tools: {
          webpackChain: (chain, { CHAIN_ID }) => {
            const { MINIMIZER } = CHAIN_ID;
            const resolvedConfig = api.useResolvedConfigContext();

            const { esbuild = {} } = resolvedConfig.tools;

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error webpack-chain missing minimizers type
            chain.optimization.minimizers
              .delete(MINIMIZER.JS)
              .delete(MINIMIZER.CSS)
              .end()
              .minimizer(MINIMIZER.ESBUILD)
              .use(ESBuildPlugin, [esbuild]);
          },
        },
      };
    },
  }),
});
