import { fs, logger, chalk } from '@modern-js/utils';
import type { BaseBuildConfig } from '../types';
import { i18n, localeKeys } from '../locale';

export const clearBuildConfigPaths = async (
  configs: BaseBuildConfig[],
  projectAbsRootPath: string,
) => {
  for (const config of configs) {
    if (projectAbsRootPath === config.outDir) {
      logger.warn(chalk.bgYellowBright(i18n.t(localeKeys.warns.clearRootPath)));
    } else {
      await fs.remove(config.outDir);
    }
  }
};
