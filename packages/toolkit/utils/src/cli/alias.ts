import fs from 'fs';
import { applyOptionsChain } from './applyOptionsChain';
import { readTsConfigWithExtends } from './get';

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

  // `paths` / `baseUrl` may live in a parent config (for example a
  // `tsconfig.server.json` that only extends `tsconfig.json`), so the whole
  // `extends` chain has to be read, not just the given file.
  const tsconfig = readTsConfigWithExtends(option.tsconfigPath);

  return {
    absoluteBaseUrl:
      tsconfig.baseUrl ?? tsconfig.pathsBaseDir ?? option.appDirectory,
    paths: {
      ...alias,
      ...tsconfig.compilerOptions.paths,
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
