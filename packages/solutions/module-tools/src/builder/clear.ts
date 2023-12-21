import { basename, relative, resolve, dirname } from 'path';
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
        tsBuildInfoFile = '.tsbuildinfo',
      } = compilerOptions || {};
      if (!composite && !incremental) {
        // js project will return, too.
        return;
      }
      // real outDir will be set to distPath
      const outDir = config.dts.distPath;
      const tsconfigDir = dirname(config.tsconfig);

      // https://www.typescriptlang.org/tsconfig#tsBuildInfoFile
      let tsbuildInfoFilePath = `${basename(
        config.tsconfig,
        '.json',
      )}${tsBuildInfoFile}`;
      if (rootDir) {
        tsbuildInfoFilePath = resolve(
          outDir,
          relative(resolve(tsconfigDir, rootDir), tsconfigDir),
          tsbuildInfoFilePath,
        );
      } else {
        tsbuildInfoFilePath = resolve(outDir, tsbuildInfoFilePath);
      }

      debug('clear tsbuildinfo');
      if (await fs.pathExists(tsbuildInfoFilePath)) {
        await fs.remove(tsbuildInfoFilePath);
      } else {
        debug(`${tsbuildInfoFilePath} doesn't exist`);
      }
    }
  }
};
