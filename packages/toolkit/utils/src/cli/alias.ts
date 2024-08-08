import fs from 'fs';
import path from 'path';
import { readTsConfigByFile } from './get';
import { applyOptionsChain } from './applyOptionsChain';

export type Alias = Record<string, string | string[]>;

export type AliasOption = Alias | ((aliases: Alias) => Alias | void);

interface NormalizedConfig {
  source: {
    alias?: AliasOption | Array<AliasOption>;
  };
}

interface IAliasConfig {
  absoluteBaseUrl: string;
  paths?: Record<string, string | string[]>;
  isTsPath?: boolean;
  isTsProject?: boolean;
}

export const mergeAlias = (alias: NormalizedConfig['source']['alias']): Alias =>
  applyOptionsChain({}, alias);

export const getAliasConfig = (
  aliasOption: NormalizedConfig['source']['alias'],
  option: { appDirectory: string; tsconfigPath: string },
): IAliasConfig => {
  const isTsProject = fs.existsSync(option.tsconfigPath);
  const alias = mergeAlias(aliasOption);

  if (!isTsProject) {
    return {
      absoluteBaseUrl: option.appDirectory,
      paths: alias,
      isTsPath: false,
      isTsProject,
    };
  }

  const tsconfig = readTsConfigByFile(option.tsconfigPath);
  const baseUrl = tsconfig?.compilerOptions?.baseUrl;

  return {
    absoluteBaseUrl: baseUrl
      ? path.join(option.appDirectory, baseUrl)
      : option.appDirectory,
    paths: {
      ...alias,
      ...tsconfig?.compilerOptions?.paths,
    },
    isTsPath: true,
    isTsProject,
  };
};

// filter invalid ts paths that are not array
export const getUserAlias = (alias: Record<string, string | string[]> = {}) =>
  Object.keys(alias).reduce(
    (o, k) => {
      if (Array.isArray(alias[k])) {
        o[k] = alias[k];
      }
      return o;
    },
    {} as Record<string, string | string[]>,
  );
