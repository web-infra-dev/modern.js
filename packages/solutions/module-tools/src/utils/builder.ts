import path from 'path';
import qs from 'querystring';
import { logger, fs } from '@modern-js/utils';
import type { ExternalHelpers } from '../types/config';

type Query = Record<string, string | boolean>;

type ResolveResult = {
  originalFilePath: string;
  query: Query;
  rawQuery?: string;
};
export const getAllDeps = async <T>(
  appDirectory: string,
  options: {
    dependencies?: boolean;
    devDependencies?: boolean;
    peerDependencies?: boolean;
  } = {},
) => {
  try {
    const json = JSON.parse(
      fs.readFileSync(path.resolve(appDirectory, './package.json'), 'utf8'),
    );

    let deps: string[] = [];

    if (options.dependencies) {
      deps = [
        ...deps,
        ...Object.keys((json.dependencies as T | undefined) || {}),
      ];
    }

    if (options.devDependencies) {
      deps = [
        ...deps,
        ...Object.keys((json.devDependencies as T | undefined) || {}),
      ];
    }

    if (options.peerDependencies) {
      deps = [
        ...deps,
        ...Object.keys((json.peerDependencies as T | undefined) || {}),
      ];
    }

    return deps;
  } catch (e) {
    logger.warn('package.json is broken');
    return [];
  }
};

export const checkSwcHelpers = async (options: {
  appDirectory: string;
  externalHelpers: ExternalHelpers;
}) => {
  const { appDirectory, externalHelpers } = options;
  if (externalHelpers === false) {
    return;
  }
  const deps = await getAllDeps(appDirectory, {
    dependencies: true,
    devDependencies: true,
  });
  const swcHelpersPkgName = '@swc/helpers';
  if (!deps.includes(swcHelpersPkgName)) {
    const local = await import('../locale');
    throw new Error(local.i18n.t(local.localeKeys.errors.externalHelpers));
  }
};

export const normalizeSlashes = (file: string) => {
  return file.split(path.win32.sep).join('/');
};

export const resolvePathAndQuery = (originalPath: string): ResolveResult => {
  const [filePath, queryStr] = originalPath.split('?');
  const query = qs.parse(queryStr ?? '') as Query;

  for (const key of Object.keys(query)) {
    if (query[key] === '') {
      query[key] = true;
    }
  }

  return {
    query,
    originalFilePath: filePath,
    rawQuery: queryStr,
  };
};

const cssLangs = `\\.(css|less|sass|scss)($|\\?)`;
const cssModuleRE = new RegExp(`\\.module${cssLangs}`);

export const isCssModule = (
  filePath: string,
  autoModules: boolean | RegExp,
) => {
  return typeof autoModules === 'boolean'
    ? autoModules && cssModuleRE.test(filePath)
    : autoModules.test(filePath);
};
