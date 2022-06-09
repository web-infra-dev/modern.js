import { HttpMethod } from '../types';

export const AllHttpMethods = Object.values(HttpMethod) as string[];

export enum APIMode {
  /**
   * 框架模式
   */
  FARMEWORK = 'FARMEWORK',

  /**
   * 函数模式
   */
  FUNCTION = 'FUNCTION',
}

export const FRAMEWORK_MODE_LAMBDA_DIR = 'lambda';

export const INDEX_SUFFIX = 'index';

export const API_DIR = 'api';

export const API_FILE_RULES = [
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
