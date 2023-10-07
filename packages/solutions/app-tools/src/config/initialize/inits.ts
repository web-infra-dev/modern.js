import path, { isAbsolute } from 'path';
import { findExists } from '@modern-js/utils';
import { AppNormalizedConfig, IAppContext } from '../../types';

export function initHtmlConfig(
  config: AppNormalizedConfig<'shared'>,
  appContext: IAppContext,
) {
  const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'ico'];
  config.html.appIcon = createBuilderAppIcon(config, appContext);
  config.html.favicon = createBuilderFavicon(config, appContext);

  return config.html;

  function createBuilderAppIcon(
    config: AppNormalizedConfig<'shared'>,
    appContext: IAppContext,
  ) {
    const { configDir } = config.source;
    const appIcon = findExists(
      ICON_EXTENSIONS.map(ext =>
        path.resolve(
          appContext.appDirectory,
          configDir || './config',
          `icon.${ext}`,
        ),
      ),
    );
    return typeof appIcon === 'string' ? appIcon : undefined;
  }
  function createBuilderFavicon(
    config: AppNormalizedConfig<'shared'>,
    appContext: IAppContext,
  ) {
    const { configDir } = config.source;
    const { favicon } = config.html;
    const defaultFavicon = findExists(
      ICON_EXTENSIONS.map(ext =>
        path.resolve(
          appContext.appDirectory,
          configDir || './config',
          `favicon.${ext}`,
        ),
      ),
    );
    return favicon || defaultFavicon || undefined;
  }
}

export function initSourceConfig(
  config: AppNormalizedConfig<'shared'>,
  appContext: IAppContext,
  bundler: 'webpack' | 'rspack',
) {
  config.source.include = createBuilderInclude(config, appContext);

  if (bundler === 'webpack') {
    (config as AppNormalizedConfig).source.moduleScopes =
      createBuilderModuleScope(config as AppNormalizedConfig);
  }

  function createBuilderInclude(
    config: AppNormalizedConfig<'shared'>,
    appContext: IAppContext,
  ) {
    const { include } = config.source;
    const defaultInclude = [appContext.internalDirectory];
    const transformInclude = (include || [])
      .map((include: string | RegExp) => {
        if (typeof include === 'string') {
          if (isAbsolute(include)) {
            return include;
          }
          return new RegExp(include);
        }
        return include;
      })
      .concat(defaultInclude); // concat default Include

    return transformInclude;
  }

  function createBuilderModuleScope(config: AppNormalizedConfig<'webpack'>) {
    const { moduleScopes } = config.source;
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

    function isPrimitiveScope(
      items: unknown[],
    ): items is Array<string | RegExp> {
      return items.every(
        item =>
          typeof item === 'string' ||
          Object.prototype.toString.call(item) === '[object RegExp]',
      );
    }
  }
}
