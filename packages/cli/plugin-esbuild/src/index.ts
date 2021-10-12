import { createPlugin, useResolvedConfigContext } from '@modern-js/core';
import type { Configuration } from 'webpack';
import type Chain from 'webpack-chain';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { ESBuildPlugin } from './esbuild-webpack-plugin';

export default createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-esbuild'];
    },
    config() {
      return {
        tools: {
          webpack: (config: Configuration, { chain }: { chain: Chain }) => {
            /* eslint-disable react-hooks/rules-of-hooks */
            const resolvedConfig = useResolvedConfigContext();
            /* eslint-enable react-hooks/rules-of-hooks */

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
  { name: '@modern-js/plugin-esbuild' },
) as any;
