import { CachedInputFileSystem, create } from 'enhanced-resolve';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { ImportKind } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { LibuildError } from '../error';
import { UserConfig } from '../types';
import { ErrorCode } from '../constants/error';

export const jsExtensions = ['.jsx', '.tsx', '.js', '.ts', '.json'];
/**
 * supports require js plugin in less file
 */
export const cssExtensions = ['.less', '.css', '.sass', '.scss', '.js'];

function createEnhancedResolve(options: ResolverOptions): {
  resolveSync: { resolve: (dir: string, id: string) => string /** TODO: string | false  */ };
  esmResolveSync: { resolve: (dir: string, id: string) => string /** TODO: string | false  */ };
} {
  const plugins = [];
  const tsconfigPath = path.join(options.root, './tsconfig.json');
  // tsconfig-paths directly statSync `tsconfig.json` without confirm it's exist.
  if (fs.existsSync(tsconfigPath)) {
    plugins.push(
      new TsconfigPathsPlugin({
        baseUrl: options.root,
        configFile: tsconfigPath,
      })
    );
  }
  const resolveOptions = {
    aliasFields: options.platform === 'browser' ? ['browser'] : [],
    FileSystem: new CachedInputFileSystem(fs, 4000),
    mainFields: options.mainFields ?? ['module', 'browser', 'main'],
    mainFiles: options.mainFiles,
    extensions: options.extensions,
    preferRelative: options.preferRelative,
    addMatchAll: false,
    plugins,
    alias: options.alias,
  };
  // conditionNames follow webpack options
  // cjs
  const resolveSync = {
    resolve: (dir: string, id: string) =>
      create.sync({
        ...resolveOptions,
        conditionNames: [options.platform, 'require', 'module'],
      })(dir, id),
  };
  const esmResolveSync = {
    resolve: (dir: string, id: string) =>
      create.sync({
        ...resolveOptions,
        conditionNames: [options.platform, 'import', 'module'],
      })(dir, id),
  };
  return {
    // @ts-ignored
    resolveSync,
    // @ts-ignored
    esmResolveSync,
  };
}

interface ResolverOptions {
  platform: NonNullable<UserConfig['platform']>;
  resolveType: 'css' | 'js';
  root: string;
  mainFields?: string[];
  mainFiles?: string[];
  alias?: Record<string, string>;
  preferRelative?: boolean;
  extensions?: string[];
  enableNativeResolve?: boolean;
}

export const createResolver = (options: ResolverOptions) => {
  const resolveCache = new Map<string, string>();
  const { resolveSync, esmResolveSync } = createEnhancedResolve(options);
  const resolver = (id: string, dir: string, kind?: ImportKind) => {
    const cacheKey = id + dir + kind;
    const cacheResult = resolveCache.get(cacheKey);

    if (cacheResult) {
      return cacheResult as string;
    }
    let result: string;
    try {
      if (options.resolveType === 'js') {
        if (kind === 'import-statement' || kind === 'dynamic-import') {
          result = esmResolveSync.resolve(dir, id);
        } else {
          result = resolveSync.resolve(dir, id);
        }
      } else {
        try {
          result = resolveSync.resolve(dir, id);
        } catch (err) {
          result = resolveSync.resolve(dir, id.replace(/^~/, ''));
        }
      }
      resolveCache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      throw new LibuildError(ErrorCode.NODE_RESOLVE_FAILED, err.message);
    }
  };
  return resolver;
};
