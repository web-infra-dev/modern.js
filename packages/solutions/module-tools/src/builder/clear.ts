import { fs, logger, chalk, execa } from '@modern-js/utils';
import type { BaseBuildConfig } from '../types';
import { i18n, localeKeys } from '../locale';
import { getTscBinPath } from '../utils';

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

    // tsc --build --clean
    if (
      config.buildType === 'bundleless' &&
      config.dts &&
      // keep it same as https://github.com/web-infra-dev/modern.js/blob/main/packages/solutions/module-tools/src/builder/build.ts#L37
      (await fs.pathExists(config.tsconfig))
    ) {
      const tscBinFile = await getTscBinPath(projectAbsRootPath);
      const childProgress = execa(tscBinFile, ['--build', '--clean'], {
        stdio: 'pipe',
        cwd: projectAbsRootPath,
      });
      try {
        await childProgress;
      } catch (e) {
        logger.error(e);
      }
    }
  }
};
