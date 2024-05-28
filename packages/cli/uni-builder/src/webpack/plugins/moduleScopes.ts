import path from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { type ChainedConfig } from '@rsbuild/shared';
import type { ModuleScopes } from '../../types';

const ensureAbsolutePath = (base: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);

export const isPrimitiveScope = (
  items: unknown[],
): items is Array<string | RegExp> =>
  items.every(
    item =>
      typeof item === 'string' ||
      Object.prototype.toString.call(item) === '[object RegExp]',
  );

export const applyScopeChain = (
  defaults: ModuleScopes,
  options: ChainedConfig<ModuleScopes>,
): ModuleScopes => {
  if (Array.isArray(options)) {
    if (isPrimitiveScope(options)) {
      return defaults.concat(options);
    }
    return options.reduce<ModuleScopes>(applyScopeChain, defaults);
  }
  return options(defaults) || defaults;
};

export const pluginModuleScopes = (
  moduleScopes?: ChainedConfig<ModuleScopes>,
): RsbuildPlugin => ({
  name: 'uni-builder:module-scopes',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      if (!moduleScopes) {
        return;
      }

      const { ModuleScopePlugin } = await import('../ModuleScopePlugin');

      const scopes = applyScopeChain([], moduleScopes);

      const rootPackageJson = path.resolve(
        api.context.rootPath,
        './package.json',
      );

      const formattedScopes = scopes.map((scope: string | RegExp) => {
        if (typeof scope === 'string') {
          return ensureAbsolutePath(api.context.rootPath, scope);
        }
        return scope;
      });

      chain.resolve
        .plugin(CHAIN_ID.RESOLVE_PLUGIN.MODULE_SCOPE)
        .use(ModuleScopePlugin, [
          {
            scopes: formattedScopes,
            allowedFiles: [rootPackageJson],
          },
        ]);
    });
  },
});
