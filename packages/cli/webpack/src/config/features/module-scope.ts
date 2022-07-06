import path from 'path';
import { CHAIN_ID, ensureAbsolutePath, isString } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyModuleScopePlugin({
  chain,
  config,
  appContext,
}: ChainUtils) {
  let defaultScopes: Array<string | RegExp> = [
    './src',
    './shared',
    /node_modules/,
  ];

  const scopeOptions = config.source?.moduleScopes;

  if (Array.isArray(scopeOptions)) {
    if (scopeOptions.some(s => typeof s === 'function')) {
      for (const scope of scopeOptions) {
        if (typeof scope === 'function') {
          const ret = scope(defaultScopes);
          defaultScopes = ret ? ret : defaultScopes;
        } else {
          defaultScopes.push(scope as string | RegExp);
        }
      }
    } else {
      defaultScopes.push(...(scopeOptions as Array<string | RegExp>));
    }
  }

  const { ModuleScopePlugin } = require('../../plugins/module-scope-plugin');

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.MODULE_SCOPE)
    .use(ModuleScopePlugin, [
      {
        appSrc: defaultScopes.map((scope: string | RegExp) => {
          if (isString(scope)) {
            return ensureAbsolutePath(appContext.appDirectory, scope);
          }
          return scope;
        }),
        allowedFiles: [path.resolve(appContext.appDirectory, './package.json')],
      },
    ]);
}
