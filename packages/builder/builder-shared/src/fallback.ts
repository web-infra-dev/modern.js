import { JS_REGEX, TS_REGEX, HTML_REGEX, JSON_REGEX } from './constants';
import type { RuleSetRule } from 'webpack';

type Rules = (undefined | null | false | '' | 0 | RuleSetRule | '...')[];

export const resourceRuleFallback = (
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
      JSON_REGEX,
    ],
    type: 'asset/resource',
  };

  return [...outerRules, { oneOf: [...innerRules, fileLoader] }];
};
