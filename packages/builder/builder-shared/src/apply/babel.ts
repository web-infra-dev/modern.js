import {
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
  rule: BundlerChainRule;
  config: SharedNormalizedConfig;
  context: BuilderContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [context.rootPath, { not: /node_modules/ }],
  });

  [...includes, ...(config.source.include || [])].forEach(condition => {
    rule.include.add(condition);
  });

  [...excludes, ...(config.source.exclude || [])].forEach(condition => {
    rule.exclude.add(condition);
  });
}
