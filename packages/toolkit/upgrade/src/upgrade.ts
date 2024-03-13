import path from 'path';

import {
  getSolutionFromDependance,
  getPackageManager,
} from '@modern-js/generator-utils';
import { Solution, PackageManager } from '@modern-js/generator-common';
import { fs, logger } from '@modern-js/utils';

import {
  getVersion,
  getModernDeps,
  validateDepsVerison,
  updateModernVersion,
  handleNpmrc,
  handleHuskyV8,
  updateMonorepoDeps,
} from './utils';

import { i18n, localeKeys } from './locale';

export interface Options {
  cwd?: string;
  debug?: boolean;
  distTag?: string;
  registry?: string;
  noNeedInstall?: boolean;
}

export const upgradeAction = async ({
  cwd,
  distTag,
  registry,
}: Options): Promise<void> => {
  const rootPath = cwd ?? process.cwd();
  const pkgJsonPath = path.join(rootPath, 'package.json');
  const pkgJson: Record<string, any> = fs.readJSONSync(pkgJsonPath, 'utf-8');

  // get solution from package.json
  const { solution, dependence: solutionDepName } =
    getSolutionFromDependance(pkgJsonPath);

  const modernLatestVersion = await getVersion(
    solutionDepName,
    distTag,
    registry,
  );
  // modern deps should be upgraded
  const modernDeps = getModernDeps(pkgJson);

  // check if need upgrade
  if (validateDepsVerison(modernDeps, modernLatestVersion)) {
    // current is latest verion
    logger.info(i18n.t(localeKeys.info.isLatest));
    return;
  }

  const packageManager = await getPackageManager();

  // pnpm
  if (packageManager === PackageManager.Pnpm) {
    // .npmrc
    await handleNpmrc(rootPath);
    // monorepo
    if (solution === Solution.Monorepo) {
      await updateMonorepoDeps();
      return;
    }
  }

  // update modern version to latest
  // special deps update to their latest ?
  updateModernVersion(pkgJson, modernLatestVersion);

  // husky
  handleHuskyV8(rootPath, pkgJson);

  // write pacakge.json
  fs.writeJSONSync(pkgJsonPath, pkgJson, { spaces: 2 });

  // show success
  logger.success(i18n.t(localeKeys.info.success));

  // install ?
};
