import { JS_REGEX, TS_REGEX } from '../shared';
import type { BuilderPlugin } from '../types';
import type { RuleSetRule } from 'webpack';

export const PluginFallback = (): BuilderPlugin => ({
  name: 'builder-plugin-fallback',

  setup(api) {
    api.modifyWebpackConfig(config => {
      const builderConfig = api.getBuilderConfig();
      if (builderConfig.output?.enableAssetFallback !== true) {
        return;
      }

      const innerRules: Array<RuleSetRule> = [];
      const outerRules: Array<RuleSetRule | '...'> = [];

      for (const rule of config.module!.rules!) {
        // "..." refers to the webpack defaults
        if (rule === '...' || rule.resolve) {
          outerRules.push(rule);
        } else if (
          rule.oneOf &&
          !(rule.test || rule.exclude || rule.resource || rule.issuer)
        ) {
          rule.oneOf.forEach(r => innerRules.push(r));
        } else {
          innerRules.push(rule);
        }
      }

      const fileLoader = {
        exclude: [
          JS_REGEX,
          TS_REGEX,
          // exclude `html` and `json`, they get processed by webpack internal loaders.
          /\.html$/,
          /\.json$/,
        ],
        type: 'asset/resource',
      };

      config.module!.rules = [
        ...outerRules,
        {
          oneOf: [...innerRules, fileLoader],
        },
      ];
    });
  },
});
