import * as path from 'path';
import { fs, execa } from '@modern-js/utils';
import { LOCK_FILE } from '../constants';

import { PackageManagerType } from '../parse-config';

export const removeLockFile = (
  rootPath: string,
  packageManager: PackageManagerType,
) => {
  if (packageManager === 'pnpm') {
    fs.removeSync(path.join(rootPath, LOCK_FILE.PNPM));
  } else if (packageManager === 'yarn') {
    fs.removeSync(path.join(rootPath, LOCK_FILE.YARN));
  } else if (packageManager === 'npm') {
    fs.removeSync(path.join(rootPath, LOCK_FILE.NPM));
  }
};

export const installByPackageManager = async (
  packageManager: PackageManagerType,
  { rootPath, removeLock }: { rootPath: string; removeLock?: boolean },
) => {
  if (removeLock) {
    removeLockFile(rootPath, packageManager);
  }

  if (packageManager === 'pnpm') {
    await execa('pnpm', ['install'], { stdio: 'inherit' });
  }

  if (packageManager === 'yarn') {
    await execa('yarn', ['install'], { stdio: 'inherit' });
  }
};
