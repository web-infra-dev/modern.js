import { join } from 'path';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import { JS_REGEX, TS_REGEX, getHash } from '../../shared/utils';

const HTML_REGEX = /\.html$/;

type RuleSetRule = Rspack.RuleSetRule;

type Rules = (undefined | null | false | '' | 0 | RuleSetRule | '...')[];

const resourceRuleFallback = (
  rules: Rules = [],
): Array<RuleSetRule | '...'> => {
  const innerRules: RuleSetRule[] = [];
  const outerRules: Array<RuleSetRule | '...'> = [];

  for (const rule of rules) {
    if (!rule) {
      continue;
    }
    if (
      // "..." refers to the webpack defaults
      rule === '...' ||
      // this is a special case, put the mjs fullySpecified rule in the outside
      (rule.resolve && 'fullySpecified' in rule.resolve && !rule.mimetype)
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
      rule.oneOf.forEach(item => {
        if (item) {
          innerRules.push(item);
        }
      });
    } else {
      innerRules.push(rule);
    }
  }

  const fileLoader = {
    exclude: [
      JS_REGEX,
      TS_REGEX,
      // exclude `html` and `json`, they get processed by webpack internal loaders.
      HTML_REGEX,
      /\.json$/,
    ],
    type: 'asset/resource',
  };

  return [...outerRules, { oneOf: [...innerRules, fileLoader] }];
};

export const pluginFallback = (): RsbuildPlugin => ({
  name: 'uni-builder:fallback',

  setup(api) {
    api.modifyBundlerChain((chain, { environment }) => {
      const rsbuildConfig = environment.config;
      const { distPath, filename } = rsbuildConfig.output;
      const distDir = distPath.media;
      const mediaFilename =
        filename.media ?? `[name]${getHash(rsbuildConfig)}[ext]`;

      chain.output.merge({
        assetModuleFilename: join(distDir, mediaFilename),
      });
    });

    if (api.context.bundlerType === 'webpack') {
      api.modifyWebpackConfig(config => {
        if (!config.module) {
          return;
        }

        // @ts-expect-error rule type mismatch
        config.module.rules = resourceRuleFallback(config.module.rules);
      });
    } else {
      api.modifyRspackConfig(config => {
        if (!config.module) {
          return;
        }

        config.module ||= {};
        config.module.rules = resourceRuleFallback(config.module?.rules);
      });
    }
  },
});
