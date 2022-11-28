import path, { dirname, isAbsolute, posix, sep } from 'path';
import {
  applyOptionsChain,
  findExists,
  findMonorepoRoot,
  globby,
  isModernjsMonorepo,
} from '@modern-js/utils';
import { AppNormalizedConfig, IAppContext } from '../../types';

export function updateHtmlConfig(
  config: AppNormalizedConfig,
  appContext: IAppContext,
) {
  const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'ico'];
  config.html.appIcon = createBuilderAppIcon(config, appContext);
  config.html.favicon = createBuilderFavicon(config, appContext);

  return config.html;

  function createBuilderAppIcon(
    config: AppNormalizedConfig,
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
    config: AppNormalizedConfig,
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
export function updateSourceConfig(
  config: AppNormalizedConfig,
  appContext: IAppContext,
) {
  config.source.include = createBuilderInclude(config, appContext);

  function createBuilderInclude(
    config: AppNormalizedConfig,
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
}
export function updateToolsConfig(config: AppNormalizedConfig) {
  const defaultTsChecker = {
    issue: {
      include: [{ file: '**/src/**/*' }],
      exclude: [
        { file: '**/*.(spec|test).ts' },
        { file: '**/node_modules/**/*' },
      ],
    },
  };

  const defaultTsLoader = {
    compilerOptions: {
      target: 'es5' as any,
      module: 'ESNext' as any,
    },
    transpileOnly: false,
    allowTsInNodeModules: true,
  };

  config.tools.tsChecker = applyOptionsChain(
    defaultTsChecker,
    config.tools.tsChecker,
  );

  config.tools.tsLoader = (tsLoaderConfig, utils) => {
    applyOptionsChain(
      {
        ...tsLoaderConfig,
        ...defaultTsLoader,
      },
      config.tools.tsLoader || {},
      utils,
    );
  };
  const { htmlPlugin } = config.tools;
  config.tools.htmlPlugin = [
    config => ({
      ...config,
      minify:
        typeof config.minify === 'object'
          ? {
              ...config.minify,
              removeComments: false,
            }
          : config.minify,
    }),
    // eslint-disable-next-line no-nested-ternary
    ...(Array.isArray(htmlPlugin)
      ? htmlPlugin
      : htmlPlugin
      ? [htmlPlugin]
      : []),
  ];
}
