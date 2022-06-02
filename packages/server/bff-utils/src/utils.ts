import path from 'path';
import { fs, globby } from '@modern-js/utils';
import {
  AllHttpMethods,
  HttpMethod,
  APIMode,
  FRAMEWORK_MODE_LAMBDA_DIR,
} from './constant';

export const createExistChecker = (base: string) => (target: string) =>
  fs.pathExistsSync(path.resolve(base, target));

export const getAPIMode = (apiDir: string): APIMode => {
  const exist = createExistChecker(apiDir);

  if (exist(FRAMEWORK_MODE_LAMBDA_DIR)) {
    return APIMode.FARMEWORK;
  }

  return APIMode.FUNCTION;
};

export const isAllowedHttpMethod = (method: string): method is HttpMethod =>
  AllHttpMethods.includes(method.toUpperCase());

const API_FILE_RULES = [
  '**/*.[tj]s',
  '!**/_*',
  '!**/_*/**/*.[tj]s',
  '!**/*.test.js',
  '!**/*.test.ts',
  '!**/*.d.ts',
  '!__test__/*.ts',
  '!__tests__/*.ts',
  '!node_modules/**',
  '!bootstrap.js',
];

/* deprecated */
export const getAllAPIFiles = (lambdaDir: string): string[] =>
  getAllFiles(lambdaDir, API_FILE_RULES);

export const getAllFiles = (
  lambdaDir: string,
  rules: string | string[],
): string[] =>
  globby
    .sync(rules, {
      cwd: lambdaDir,
      gitignore: true,
    } as any)
    .map(file => path.resolve(lambdaDir, file as any));

/* deprecated */
export const getLambdaDir = (apiDir: string): string => {
  const mode = getAPIMode(apiDir);

  const lambdaDir =
    mode === APIMode.FARMEWORK
      ? path.join(apiDir, FRAMEWORK_MODE_LAMBDA_DIR)
      : apiDir;

  return lambdaDir;
};

export const requireModule = (modulePath: string) => {
  const requiredModule = require(modulePath);
  if (requiredModule.__esModule && requiredModule.default) {
    return requiredModule.default;
  }
  return requiredModule;
};
