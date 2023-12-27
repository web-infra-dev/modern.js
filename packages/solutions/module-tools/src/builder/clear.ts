import { basename, relative, resolve, dirname, join } from 'path';
import { fs, logger, chalk } from '@modern-js/utils';

import type { BaseBuildConfig } from '../types';
import { i18n, localeKeys } from '../locale';
import { getProjectTsconfig } from '../utils';
import { debug } from '../debug';

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

    // clear tsbuildInfo
    if (config.buildType === 'bundleless' && config.dts) {
      const { compilerOptions } = await getProjectTsconfig(config.tsconfig);
      const {
        composite,
        incremental,
        rootDir,
        outDir,
        tsBuildInfoFile = '.tsbuildinfo',
      } = compilerOptions || {};
      if (!composite && !incremental) {
        // js project will return, too.
        return;
      }
      const tsconfigDir = dirname(config.tsconfig);

      // https://www.typescriptlang.org/tsconfig#tsBuildInfoFile
      let tsbuildInfoFilePath = `${basename(
        config.tsconfig,
        '.json',
      )}${tsBuildInfoFile}`;
      if (outDir) {
        if (rootDir) {
          tsbuildInfoFilePath = join(
            outDir,
            relative(resolve(tsconfigDir, rootDir), tsconfigDir),
            tsbuildInfoFilePath,
          );
        } else {
          tsbuildInfoFilePath = join(outDir, tsbuildInfoFilePath);
        }
      }

      const tsbuildInfoFileAbsPath = resolve(tsconfigDir, tsbuildInfoFilePath);

      debug('clear tsbuildinfo');
      if (await fs.pathExists(tsbuildInfoFileAbsPath)) {
        await fs.remove(tsbuildInfoFileAbsPath);
      } else {
        debug(`${tsbuildInfoFileAbsPath} doesn't exist`);
      }
    }
  }
};
