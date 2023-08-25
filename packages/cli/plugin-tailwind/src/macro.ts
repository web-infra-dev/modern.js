import path from 'path';
import { fs, nanoid, slash } from '@modern-js/utils';

export const template = (configPath: string) => `
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
const modernConfig = _interopRequireDefault(require('${configPath}')).default;

const theme =
    modernConfig && modernConfig.source && modernConfig.source.designSystem
      ? modernConfig.source.designSystem
      : {};
const tailwindcss =
    modernConfig && modernConfig.tools && modernConfig.tools.tailwindcss
      ? modernConfig.tools.tailwindcss
      : {};

module.exports = {
    theme,
    ...tailwindcss,
};
`;

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

export const getRandomTwConfigFileName = (internalDirectory: string) => {
  return slash(
    path.join(
      internalDirectory,
      `tailwind.config.${Date.now()}.${nanoid()}.js`,
    ),
  );
};
