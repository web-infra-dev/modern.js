import { NODE_MODULES_REGEX } from '../constants';
import type {
  WebpackChainRule,
  BundlerChainRule,
  SharedNormalizedConfig,
  BuilderContext,
} from '../types';

export function applyScriptCondition({
  rule,
  config,
  context,
  includes,
  excludes,
}: {
  rule: BundlerChainRule | WebpackChainRule;
  config: SharedNormalizedConfig;
  context: BuilderContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [context.rootPath, { not: NODE_MODULES_REGEX }],
  });

  [...includes, ...(config.source.include || [])].forEach(condition => {
    rule.include.add(condition);
  });

  [...excludes, ...(config.source.exclude || [])].forEach(condition => {
    rule.exclude.add(condition);
  });
}
