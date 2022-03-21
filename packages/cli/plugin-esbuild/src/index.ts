import type { Configuration } from 'webpack';
import type Chain from 'webpack-chain';
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
          webpack: (config: Configuration, { chain }: { chain: Chain }) => {
            const resolvedConfig = api.useResolvedConfigContext();

            const { esbuild = {} } = resolvedConfig.tools;

            (chain.optimization as any).minimizers
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
