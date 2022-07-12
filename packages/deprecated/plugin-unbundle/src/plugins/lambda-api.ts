import path from 'path';
import { Plugin as RollupPlugin } from 'rollup';
import {
  getAllAPIFiles,
  getLambdaDir,
  generateClient,
} from '@modern-js/bff-utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { BFF_API_DIR } from '../constants';

export const lambdaApiPlugin = (
  config: NormalizedConfig,
  appContext: IAppContext,
): RollupPlugin => {
  const {
    server: { port },
  } = config;

  const { appDirectory } = appContext;

  const { prefix: apiPrefix = '/api' } = (config as any).bff || {};

  const apiDir = path.resolve(appDirectory, BFF_API_DIR);

  const lambdaDir = getLambdaDir(apiDir);

  const apiFiles = getAllAPIFiles(lambdaDir);

  return {
    name: 'esm-lambda-api',
    async transform(code: string, importer: string) {
      if (apiFiles.includes(importer)) {
        const result = await generateClient({
          apiDir,
          resourcePath: importer,
          source: code,
          prefix: apiPrefix,
          target: 'client',
          port: Number(port),
          requireResolve: require.resolve,
        });

        if (result.isOk) {
          return {
            code: result.value.replace(
              /import { createRequest } from '.+';/,
              `import { createRequest } from '@modern-js/create-request';`,
            ),
          };
        } else {
          throw new Error(result.value);
        }
      }
    },
  };
};
