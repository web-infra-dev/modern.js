import type { BaseBuildConfig } from '../types';

export const clearDtsTemp = async () => {
  const { fs } = await import('@modern-js/utils');
  const { dtsTempDirectory } = await import('../constants/dts');
  await fs.remove(dtsTempDirectory);
};

export const clearBuildConfigPaths = async (
  configs: BaseBuildConfig[],
  options?: {
    noClear?: boolean;
    projectAbsRootPath?: string;
  },
) => {
  const { noClear = false, projectAbsRootPath = process.cwd() } = options ?? {};
  const { fs } = await import('@modern-js/utils');

  if (noClear) {
    return;
  }

  for (const config of configs) {
    if (projectAbsRootPath === config.outDir) {
      const { logger, chalk } = await import('@modern-js/utils');
      const local = await import('../locale');
      logger.warn(
        chalk.bgYellowBright(
          local.i18n.t(local.localeKeys.warns.clearRootPath),
        ),
      );
    } else {
      await fs.remove(config.outDir);
    }
  }
};
