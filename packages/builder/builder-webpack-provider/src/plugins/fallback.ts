import { join } from 'path';
import { JS_REGEX, TS_REGEX, getDistPath } from '@modern-js/builder-shared';
import { getFilename } from '../shared';
import type { BuilderPlugin } from '../types';
import type { RuleSetRule } from 'webpack';

export const PluginFallback = (): BuilderPlugin => ({
  name: 'builder-plugin-fallback',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
      const builderConfig = api.getNormalizedConfig();

      if (builderConfig.output.enableAssetFallback) {
        const distDir = getDistPath(builderConfig.output, 'media');
        const filename = getFilename(builderConfig, 'media', isProd);

        chain.output.merge({
          assetModuleFilename: join(distDir, filename),
        });
      }
    });

    api.modifyWebpackConfig(config => {
      const builderConfig = api.getNormalizedConfig();

      if (!builderConfig.output.enableAssetFallback || !config.module) {
        return;
      }

      const { rules = [] } = config.module;

      const innerRules: Array<RuleSetRule> = [];
      const outerRules: Array<RuleSetRule | '...'> = [];

      for (const rule of rules) {
        if (
          // "..." refers to the webpack defaults
          rule === '...' ||
          // this is a special case, put the mjs fullySpecified rule in the outside
          (rule.resolve && !rule.mimetype)
        ) {
          outerRules.push(rule);
        } else if (
          rule.oneOf &&
          !(
            rule.test ||
            rule.exclude ||
            rule.resource ||
            rule.issuer ||
            rule.mimetype
          )
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

      config.module.rules = [
        ...outerRules,
        { oneOf: [...innerRules, fileLoader] },
      ];
    });
  },
});
