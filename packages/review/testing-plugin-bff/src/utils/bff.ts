import path from 'path';
import {
  getAllAPIFiles,
  getMethod,
  getLambdaDir,
  extractModuleInfoFromFilenames,
} from '@modern-js/bff-utils';

export const getAllAPIInfos = (appDir: string) => {
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
          // todo: use apiprefix
          routePath: `/api${name}`,
          apiFile: filename,
        });
      }
    });
  });

  return apiInfos;
};
