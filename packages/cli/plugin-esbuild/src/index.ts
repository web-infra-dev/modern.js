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
          webpackChain: chain => {
            const resolvedConfig = api.useResolvedConfigContext();

            const { esbuild = {} } = resolvedConfig.tools;

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error webpack-chain missing minimizers type
            chain.optimization.minimizers
              .delete('js')
              .delete('css')
              .end()
              .minimizer('js-css')
              .use(ESBuildPlugin, [esbuild]);
          },
        },
      };
    },
  }),
});
