import { dirname, isAbsolute, posix, sep } from 'path';
import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  applyOptionsChain,
  globby,
  findMonorepoRoot,
  isModernjsMonorepo,
} from '@modern-js/utils';

export function createSourceConfig(
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
): BuilderConfig['source'] {
  const { alias, envVars, globalVars, include, moduleScopes, preEntry } =
    normalizedConfig.source;

  const builderGlobalVars = globalVars || {};

  for (const envVar of envVars || []) {
    const envVarValue = process.env[envVar];
    envVarValue && (builderGlobalVars[`process.env.${envVar}`] = envVarValue);
  }

  const builderModuleScope = createBuilderModuleScope(moduleScopes);

  const builderAlias = createBuilderAlias(alias, appContext);
  const builderInclude = createBuilderInclude(include, appContext);

  return {
    alias: builderAlias,
    moduleScopes: builderModuleScope,
    globalVars: builderGlobalVars,
    include: builderInclude,
    preEntry,
    // ensure resolve.extensions same as before
    resolveExtensionPrefix: '.web',
  };
}

export function createBuilderAlias(
  alias: NormalizedConfig['source']['alias'],
  appContext: IAppContext,
) {
  // the `Type` only use here.
  type Alias = Record<string, string> | (() => Record<string, string>);
  const defaultAlias: Alias = {
    [appContext.internalDirAlias]: appContext.internalDirectory,
    [appContext.internalSrcAlias]: appContext.srcDirectory,
    '@': appContext.srcDirectory,
    '@shared': appContext.sharedDirectory,
  };

  return applyOptionsChain<Alias, unknown>(defaultAlias, alias as Alias);
}

export function createBuilderInclude(
  include: NormalizedConfig['source']['include'],
  appContext: IAppContext,
) {
  const defaultInclude = [appContext.internalDirectory];
  const transformInclude = (include || [])
    .map(include => {
      if (typeof include === 'string') {
        if (isAbsolute(include)) {
          return include;
        }
        return new RegExp(include);
      }
      return include;
    })
    .concat(defaultInclude); // concat default Include

  const root = findMonorepoRoot(appContext.appDirectory);
  if (!root) {
    return transformInclude;
  }

  const modernjsMonorepo = isModernjsMonorepo(root);
  if (modernjsMonorepo) {
    const paths = globby
      .sync(posix.join(root, 'features', '**', 'package.json'), {
        ignore: ['**/node_modules/**/*'],
      })
      .map(pathname => dirname(pathname) + sep);

    return [...paths, ...transformInclude];
  }

  return transformInclude;
}

export function createBuilderModuleScope(
  moduleScopes: NormalizedConfig['source']['moduleScopes'],
) {
  if (moduleScopes) {
    let builderModuleScope: any[] = [];
    const DEFAULT_SCOPES: Array<string | RegExp> = [
      './src',
      './shared',
      /node_modules/,
    ];
    if (Array.isArray(moduleScopes)) {
      if (isPrimitiveScope(moduleScopes)) {
        builderModuleScope = DEFAULT_SCOPES.concat(moduleScopes);
      } else {
        builderModuleScope = [DEFAULT_SCOPES, ...moduleScopes];
      }
    } else {
      builderModuleScope = [DEFAULT_SCOPES, moduleScopes];
    }
    return builderModuleScope;
  } else {
    return undefined;
  }

  function isPrimitiveScope(items: unknown[]): items is Array<string | RegExp> {
    return items.every(
      item =>
        typeof item === 'string' ||
        Object.prototype.toString.call(item) === '[object RegExp]',
    );
  }
}
