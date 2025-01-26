import path from 'path';
import { fs, nanoid, slash } from '@modern-js/utils';

const TWIN_MACRO_NAME = 'twin.macro';

export const checkTwinMacroExist = async (appDirectory: string) => {
  const packageJson =
    (await fs.readJSON(path.join(appDirectory, 'package.json'), {
      throws: false,
    })) || {};

  return Boolean(
    (typeof packageJson.dependencies === 'object' &&
      packageJson.dependencies[TWIN_MACRO_NAME]) ||
      (typeof packageJson.devDependencies === 'object' &&
        packageJson.devDependencies[TWIN_MACRO_NAME]),
  );
};

export const getTwinMacroMajorVersion = (appDirectory: string) => {
  try {
    const pkgJsonPath = require.resolve(`${TWIN_MACRO_NAME}/package.json`, {
      paths: [appDirectory],
    });
    const { version } = require(pkgJsonPath);
    return Number(version.split('.')[0]);
  } catch (err) {
    return null;
  }
};
