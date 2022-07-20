import path from 'path';
import { chalk } from '@modern-js/utils';

export const isBFFProject = (pwd: string) => {
  try {
    const packageJson = require(path.join(pwd, './package.json'));

    const { dependencies, devDependencies } = packageJson;

    const isBFF = Object.keys({ ...dependencies, ...devDependencies }).some(
      (dependency: string) => dependency.includes('plugin-bff'),
    );

    const isMWA = Object.keys(devDependencies).some((devDependency: string) =>
      devDependency.includes('app-tools'),
    );

    return isMWA && isBFF;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(chalk.red(error));
    return false;
  }
};
