import type { Rspack, RspackRule } from '@rsbuild/core';
import type { UniBuilderInstance } from '../src';

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
  return config.module.rules.filter(rule => {
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
}

export const unwrapConfig = async (rsbuild: UniBuilderInstance) => {
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
