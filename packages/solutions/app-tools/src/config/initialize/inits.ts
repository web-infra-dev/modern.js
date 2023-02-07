import path, { dirname, isAbsolute, posix, sep } from 'path';
import {
  applyOptionsChain,
  findExists,
  findMonorepoRoot,
  globby,
  isModernjsMonorepo,
} from '@modern-js/utils';
import { getAutoInjectEnv } from '../../utils/env';
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
  config.source.globalVars = createBuilderGlobalVars(config, appContext);
  if (bundler === 'webpack') {
    (config as AppNormalizedConfig).source.moduleScopes =
      createBuilderModuleScope(config as AppNormalizedConfig);
  }

  function createBuilderGlobalVars(
    config: AppNormalizedConfig<'shared'>,
    appContext: IAppContext,
  ) {
    const { globalVars = {} } = config.source;
    const publicEnv = getAutoInjectEnv(appContext);
    return { ...globalVars, ...publicEnv };
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

export function initToolsConfig(config: AppNormalizedConfig<'webpack'>) {
  const defaultTsChecker = {
    issue: {
      include: [{ file: '**/src/**/*' }],
      exclude: [
        { file: '**/*.(spec|test).ts' },
        { file: '**/node_modules/**/*' },
      ],
    },
  };

  const { tsChecker, tsLoader } = config.tools;
  config.tools.tsChecker = applyOptionsChain(defaultTsChecker, tsChecker);
  tsLoader &&
    (config.tools.tsLoader = (tsLoaderConfig, utils) => {
      applyOptionsChain(
        {
          ...tsLoaderConfig,
          transpileOnly: false,
          allowTsInNodeModules: true,
        },
        tsLoader || {},
        utils,
      );
    });
}
