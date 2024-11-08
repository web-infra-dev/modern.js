import fs from 'fs';
import { CachedInputFileSystem, create } from 'enhanced-resolve';
import type { ImportKind, Platform } from 'esbuild';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

/**
 * supports require js plugin in less file
 */
export const cssExtensions = ['.less', '.css', '.sass', '.scss', '.js'];

function createEnhancedResolve(options: ResolverOptions): {
  resolveSync: (dir: string, id: string) => string | false;
  esmResolveSync: (dir: string, id: string) => string | false;
} {
  const plugins = [];
  const { tsConfig } = options;

  const tsConfigFilePath = tsConfig?.configFile;
  const references = tsConfig?.references;

  // tsconfig-paths directly statSync `tsconfig.json` without confirm it's exist.
  if (fs.existsSync(tsConfigFilePath)) {
    plugins.push(
      new TsconfigPathsPlugin({
        configFile: tsConfigFilePath,
        references,
      }),
    );
  }
  const resolveOptions = {
    aliasFields: options.platform === 'browser' ? ['browser'] : [],
    FileSystem: new CachedInputFileSystem(fs, 4000),
    mainFields: options.mainFields,
    mainFiles: ['index'],
    extensions: options.extensions,
    preferRelative: options.preferRelative,
    addMatchAll: false,
    plugins,
    alias: options.alias,
  };

  // conditionNames follow webpack options
  // cjs
  const resolveSync = (dir: string, id: string) =>
    create.sync({
      ...resolveOptions,
      conditionNames: [options.platform, 'require', 'module'],
    })(dir, id);

  const esmResolveSync = (dir: string, id: string) =>
    create.sync({
      ...resolveOptions,
      conditionNames: [options.platform, 'import', 'module'],
    })(dir, id);

  return {
    resolveSync,
    esmResolveSync,
  };
}

export const createJsResolver = (options: ResolverOptions) => {
  const resolveCache = new Map<string, string>();
  const { resolveSync, esmResolveSync } = createEnhancedResolve(options);
  const resolver = (id: string, dir: string, kind?: ImportKind) => {
    const cacheKey = id + dir + (kind || '');
    const cacheResult = resolveCache.get(cacheKey);
    if (cacheResult) {
      return cacheResult;
    }

    let result: string | false;
    if (kind === 'import-statement' || kind === 'dynamic-import') {
      result = esmResolveSync(dir, id);
    } else {
      result = resolveSync(dir, id);
    }

    if (result) {
      resolveCache.set(cacheKey, result);
    }
    return result;
  };
  return resolver;
};

export const createCssResolver = (options: ResolverOptions) => {
  const resolveCache = new Map<string, string>();
  const { resolveSync } = createEnhancedResolve(options);
  const resolver = (id: string, dir: string, kind?: ImportKind) => {
    const cacheKey = id + dir + (kind || '');
    const cacheResult = resolveCache.get(cacheKey);
    if (cacheResult) {
      return cacheResult;
    }

    let result: string | false;
    try {
      result = resolveSync(dir, id);
    } catch (err) {
      result = resolveSync(dir, id.replace(/^~/, ''));
    }
    if (!result) {
      throw new Error(`can not resolve ${id} from ${dir}`);
    }
    resolveCache.set(cacheKey, result);
    return result;
  };
  return resolver;
};

export interface ResolverOptions {
  platform: Platform;
  resolveType: 'js' | 'css';
  extensions: string[];
  root: string;
  alias: Record<string, string>;
  // https://rspack.dev/zh/config/resolve#resolvetsconfigreferences
  tsConfig: {
    configFile: string;
    references?: string[] | undefined;
  };
  mainFields: string[];
  preferRelative?: boolean;
}
