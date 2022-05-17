import fs from 'fs';
import path from 'path';
import { applyOptionsChain, findExists } from '@modern-js/utils';
import { NormalizedInputOptions, Plugin as RollupPlugin } from 'rollup';
import alias, { Alias } from '@rollup/plugin-alias';
import {
  MatchPath,
  loadConfig,
  createMatchPath,
} from '@modern-js/utils/tsconfig-paths';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  DEV_CLIENT_PATH,
  DEV_CLIENT_PATH_ALIAS,
  BARE_SPECIFIER_REGEX,
  DEFAULT_EXTENSIONS,
} from '../constants';

// webpack alias to rollup alias entries
export const normalizeAlias = (
  config: NormalizedConfig,
  appContext: IAppContext,
  defaultDeps: string[],
) => {
  const result: Alias[] = [
    {
      find: new RegExp(`^/?${appContext.internalDirAlias}/(.*)`),
      replacement: `${appContext.internalDirectory}/$1`,
    },
    {
      find: new RegExp(`^/?${appContext.internalSrcAlias}/(.*)`),
      replacement: `${appContext.srcDirectory}/$1`,
    },
    {
      find: new RegExp(`^\\/?${DEV_CLIENT_PATH_ALIAS}\\/(.*)`),
      replacement: `${DEV_CLIENT_PATH}/$1`,
    },
  ];

  // merge default config & user config
  const option = applyOptionsChain(
    {
      '@': './src',
      '@shared': appContext.sharedDirectory,
    },
    config.source.alias as any,
  );

  Object.keys(option).forEach(key => {
    const aliasPath = option[key];
    const isAbsolute = path.isAbsolute(aliasPath);

    // should exclude modern-js/runtime api
    if (!defaultDeps.includes(key)) {
      result.push({
        find: key,
        replacement: isAbsolute
          ? aliasPath
          : `/${path.resolve(process.cwd(), aliasPath)}`,
      });
    }
  });

  return result;
};

export const aliasPlugin = (
  config: NormalizedConfig,
  appContext: IAppContext,
  defaultDeps: string[],
): RollupPlugin => {
  const aliasOptions = normalizeAlias(config, appContext, defaultDeps);
  const plugin = alias({ entries: aliasOptions });
  return {
    name: 'esm-alias',
    buildStart(options: NormalizedInputOptions) {
      return plugin.buildStart?.call(this, options);
    },
    resolveId(id: string, importer?: string) {
      return plugin.resolveId?.call(this, id, importer, {} as any);
    },
  };
};

/** Returns true when `path` is within `root` and not an installed dependency. */
const isLocalDescendant = (importer: string | undefined, root: string) => {
  if (importer) {
    return (
      importer.startsWith(root) &&
      !importer.slice(root.length).includes('/node_modules/')
    );
  } else {
    return false;
  }
};

export const tsAliasPlugin = (
  config: NormalizedConfig,
  appContext: IAppContext,
): RollupPlugin => {
  const { appDirectory: root } = appContext;

  const tsConfig: any = loadConfig(root);
  let matchPath: MatchPath;
  const { resultType } = tsConfig;
  if (resultType === 'success' && tsConfig.paths) {
    matchPath = createMatchPath(
      tsConfig.absoluteBaseUrl,
      tsConfig.paths,
      tsConfig.mainFields || [
        'module',
        'jsnext',
        'jsnext:main',
        'browser',
        'main',
      ],
      tsConfig.addMatchAll,
    );
  }
  const resolved = new Map<string, string>();

  return {
    name: 'esm-ts-alias',
    resolveId(id, importer?: string) {
      if (!BARE_SPECIFIER_REGEX.test(id)) {
        return;
      }
      if (!matchPath) {
        return;
      }
      let result = resolved.get(id);
      if (!result && isLocalDescendant(importer, root)) {
        result = matchPath(id, undefined, undefined, DEFAULT_EXTENSIONS);
        if (result) {
          result = path.extname(result)
            ? result
            : (findExists(
                DEFAULT_EXTENSIONS.map(ext => {
                  try {
                    const isDir = fs.statSync(result as string).isDirectory();
                    if (isDir) {
                      return path.resolve(
                        root,
                        `${result as string}/index${ext}`,
                      );
                    }
                  } catch (_err) {
                    // ignore err
                  }
                  return path.resolve(root, `${result as string}${ext}`);
                }),
              ) as string);
          resolved.set(id, result);
        }
      }
      return result;
    },
  };
};
