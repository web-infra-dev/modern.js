import fs from 'fs';
import path from 'path';
import { chalk } from './compiled';
import { readTsConfigByFile } from './readTsConfig';
import { applyOptionsChain } from './applyOptionsChain';

type AliasOption =
  | Record<string, string>
  | ((aliases: Record<string, string>) => Record<string, unknown>)
  | Record<string, string>
  | undefined;

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

export const validAlias = <T extends NormalizedConfig>(
  modernConfig: T,
  { tsconfigPath }: { tsconfigPath: string },
) => {
  const {
    source: { alias },
  } = modernConfig;
  if (!alias) {
    return null;
  }

  const isTsProject = fs.existsSync(tsconfigPath);
  if (!isTsProject) {
    return null;
  }

  const userAlias = getUserAlias(alias as Record<string, string>);
  if (Object.keys(userAlias).length > 0) {
    return chalk.red(
      'Note: Please use `compilerOptions.paths` in "tsconfig.json" file replace `source.alias` config in "modern.config.js/ts" when project is typescript',
    );
  }

  return null;
};

export const getAlias = (
  aliasOption: AliasOption | Array<AliasOption>,
  option: { appDirectory: string; tsconfigPath: string },
) => {
  const isTsProject = fs.existsSync(option.tsconfigPath);
  let aliasConfig: IAliasConfig;
  if (!isTsProject) {
    aliasConfig = {
      absoluteBaseUrl: option.appDirectory,
      paths: applyOptionsChain({ '@': ['./src'] }, aliasOption as any),
      isTsPath: false,
      isTsProject,
    };
  } else {
    const tsconfig = readTsConfigByFile(option.tsconfigPath);
    const baseUrl = tsconfig?.compilerOptions?.baseUrl;
    aliasConfig = {
      absoluteBaseUrl: baseUrl
        ? path.join(option.appDirectory, baseUrl)
        : option.appDirectory,
      paths: {
        ...(aliasOption || {}),
        ...tsconfig?.compilerOptions?.paths,
      },
      isTsPath: true,
      isTsProject,
    };
  }
  return aliasConfig;
};

// filter invalid ts paths that are not array
export const getUserAlias = (alias: Record<string, string | string[]> = {}) =>
  Object.keys(alias).reduce((o, k) => {
    if (Array.isArray(alias[k])) {
      o[k] = alias[k];
    }
    return o;
  }, {} as Record<string, string | string[]>);
