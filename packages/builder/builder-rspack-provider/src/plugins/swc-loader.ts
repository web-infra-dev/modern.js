import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  applyScriptCondition,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

/**
 * Provide some swc configs of rspack
 */
export const builderPluginSwcLoader = (): BuilderPlugin => ({
  name: 'builder-plugin-swc-loader',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      applyScriptCondition({
        rule,
        config,
        context: api.context,
        includes: [],
        excludes: [],
      });

      rule
        .test(mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.BABEL)
        .loader('builtin:swc-loader')
        .options({
          jsc: {
            parser: {
              topLevelAwait: true,
            },
          },
        });
    });
  },
});
