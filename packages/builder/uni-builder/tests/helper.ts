import type {
  RsbuildInstance,
  RspackConfig,
  RspackRule,
} from '@rsbuild/shared';

export function matchRules({
  config,
  testFile,
}: {
  config: RspackConfig;
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

export const unwrapConfig = async (rsbuild: RsbuildInstance) => {
  const configs = await rsbuild.initConfigs();
  return configs[0];
};

/** Match plugin by constructor name. */
export const matchPlugins = (config: RspackConfig, pluginName: string) => {
  const result = config.plugins?.filter(
    item => item?.constructor.name === pluginName,
  );

  return result || null;
};
