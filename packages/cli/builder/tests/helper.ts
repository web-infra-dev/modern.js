import type { Rspack, RspackRule } from '@rsbuild/core';
import type { BuilderInstance } from '../src';

export function matchRules({
  config,
  testFile,
}: {
  config: Rspack.Configuration;
  testFile: string;
}): RspackRule[] {
  if (!config.module?.rules) {
    return [];
  }
  const rules = config.module.rules.filter(rule => {
    if (
      rule &&
      typeof rule === 'object' &&
      rule.test &&
      rule.test instanceof RegExp &&
      rule.test.test(testFile)
    ) {
      return true;
    }
    return false;
  });

  normalizePostcssProcessorVersions(rules);

  return rules;
}

function normalizePostcssProcessorVersions(
  value: unknown,
  seen = new WeakSet<object>(),
) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (seen.has(value)) {
    return;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      normalizePostcssProcessorVersions(item, seen);
    }
    return;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.version === 'string' && Array.isArray(record.plugins)) {
    record.version = '<POSTCSS_VERSION>';
  }

  for (const item of Object.values(record)) {
    normalizePostcssProcessorVersions(item, seen);
  }
}

export const unwrapConfig = async (rsbuild: BuilderInstance) => {
  const configs = await rsbuild.initConfigs();
  return configs[0];
};

/** Match plugin by constructor name. */
export const matchPlugins = (
  config: Rspack.Configuration,
  pluginName: string,
) => {
  const result = config.plugins?.filter(
    item => item?.constructor.name === pluginName,
  );

  return result || null;
};
