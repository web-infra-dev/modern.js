import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';

export function createSourceConfig(
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
): BuilderConfig['source'] {
  const { alias, envVars, globalVars, include, moduleScopes, preEntry } =
    normalizedConfig.source;

  const builderGlobalVars = globalVars || {};
  for (const envVar in envVars) {
    builderGlobalVars[`process.env.${envVar}`] = envVar;
  }

  const builderModuleScope = createBuilderModuleScope(moduleScopes);

  const builderAlias = createBuilderAlias(alias, appContext);

  return {
    alias: builderAlias,
    moduleScopes: builderModuleScope,
    globalVars: builderGlobalVars,
    include,
    preEntry,
  };
}

function createBuilderAlias(
  alias: NormalizedConfig['source']['alias'],
  appContext: IAppContext,
) {
  // the `Type` only use here.
  const defaultAlias = {
    [appContext.internalDirAlias]: appContext.internalDirectory,
    [appContext.internalSrcAlias]: appContext.srcDirectory,
    '@': appContext.srcDirectory,
    '@shared': appContext.sharedDirectory,
  };
  type Alias = Record<string, string> | (() => Record<string, string>);
  return applyOptionsChain(defaultAlias, alias as Alias);
}

function createBuilderModuleScope(
  moduleScopes: NormalizedConfig['source']['moduleScopes'],
) {
  let builderModuleScope: any[] = [];
  if (moduleScopes) {
    const DEFAULT_SCOPES: Array<string | RegExp> = ['./src', './shared'];
    if (Array.isArray(moduleScopes)) {
      if (isPrimitiveScope(moduleScopes)) {
        builderModuleScope = DEFAULT_SCOPES.concat(moduleScopes);
      } else {
        builderModuleScope = [DEFAULT_SCOPES, ...moduleScopes];
      }
    } else {
      builderModuleScope = [DEFAULT_SCOPES, moduleScopes];
    }
  }
  return builderModuleScope;

  function isPrimitiveScope(items: unknown[]): items is Array<string | RegExp> {
    return items.every(
      item =>
        typeof item === 'string' ||
        Object.prototype.toString.call(item) === '[object RegExp]',
    );
  }
}
