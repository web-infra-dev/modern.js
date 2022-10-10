import type { AliasOption, BundlelessGeneratorDtsConfig } from '../types';

export const getFinalAlias: any = async (
  alias: AliasOption,
  config: BundlelessGeneratorDtsConfig,
) => {
  const { getAlias } = await import('@modern-js/utils');
  const aliasConfig = getAlias(alias as any, {
    appDirectory: config.appDirectory,
    tsconfigPath: config.tsconfigPath,
  });
  // 排除内部别名，因为不需要处理
  const finalPaths: Record<string, string | string[]> = {};
  const internalAliasPrefix = '@modern-js/runtime';
  if (aliasConfig.paths && typeof aliasConfig.paths === 'object') {
    const pathsKey = Object.keys(aliasConfig.paths);
    for (const key of pathsKey) {
      if (!key.includes(internalAliasPrefix)) {
        finalPaths[key] = aliasConfig.paths[key];
      }
    }
  }

  aliasConfig.paths = finalPaths;
  return aliasConfig;
};
