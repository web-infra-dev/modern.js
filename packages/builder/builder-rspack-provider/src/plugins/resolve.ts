import type { BuilderPlugin } from '../types';
import {
  setConfig,
  applyBuilderResolvePlugin,
} from '@modern-js/builder-shared';

export const builderPluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    applyBuilderResolvePlugin(api);

    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (
        chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI) &&
        config.source.compileJsDataURI
      ) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .resolve.set('fullySpecified', false);
      }
    });

    api.modifyRspackConfig(async (rspackConfig, { isServer }) => {
      const isTsProject = Boolean(api.context.tsconfigPath);
      const config = api.getNormalizedConfig();

      if (isTsProject && config.source.aliasStrategy === 'prefer-tsconfig') {
        setConfig(
          rspackConfig,
          'resolve.tsConfigPath',
          api.context.tsconfigPath,
        );
      }

      if (isServer) {
        // FIXME:
        // When targe = node, we no need to specify conditionsNames.
        // We gueess the webpack would auto specify refrence to target.
        // Rspack has't the action, so we need manually specify.
        const nodeConditionNames = ['require', 'node'];
        setConfig(rspackConfig, 'resolve.conditionNames', nodeConditionNames);
      }
    });
  },
});
