import path from 'path';
import {
  getAllAPIFiles,
  getMethod,
  getLambdaDir,
  extractModuleInfoFromFilenames,
} from '@modern-js/bff-utils';
import { chalk } from '@modern-js/utils';

export const getAllAPIInfos = (appDir: string, prefix = '/api') => {
  const lambdaDir = getLambdaDir(path.join(appDir, './api'));
  const filenames = getAllAPIFiles(lambdaDir);

  const moduleInfos = extractModuleInfoFromFilenames(lambdaDir, filenames);
  const apiInfos: {
    handler: (...args: any) => any;
    method: string;
    routePath: string;
    apiFile: string;
    name: string;
  }[] = [];

  moduleInfos.forEach(({ name, module, filename }) => {
    Object.keys(module).forEach(key => {
      const handler = (module as any)[key];
      const method = getMethod(key);
      if (typeof handler === 'function') {
        apiInfos.push({
          handler,
          method,
          name: key,
          routePath: `${prefix}${name}`,
          apiFile: filename,
        });
      }
    });
  });

  return apiInfos;
};

export const isBFFProject = (pwd: string) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require,@typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
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
