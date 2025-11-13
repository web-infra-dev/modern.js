import path, { isAbsolute } from 'path';
import { findExists } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/plugin';

export function initHtmlConfig(
  config: AppNormalizedConfig,
  appContext: AppToolsContext,
): AppNormalizedConfig['html'] {
  const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'ico'];
  config.html.appIcon = createBuilderAppIcon(config, appContext);
  config.html.favicon = createBuilderFavicon(config, appContext);

  return config.html;

  function createBuilderAppIcon(
    config: AppNormalizedConfig,
    appContext: AppToolsContext,
  ) {
    const { appIcon } = config.html;
    const { configDir } = config.source;
    const getDefaultAppIcon = () => {
      const appIconPath = findExists(
        ICON_EXTENSIONS.map(ext =>
          path.resolve(
            appContext.appDirectory,
            configDir || './config',
            `icon.${ext}`,
          ),
        ),
      );
      return appIconPath
        ? { icons: [{ src: appIconPath, size: 180 }] }
        : undefined;
    };
    return appIcon || getDefaultAppIcon() || undefined;
  }
  function createBuilderFavicon(
    config: AppNormalizedConfig,
    appContext: AppToolsContext,
  ) {
    const { configDir } = config.source;
    const { favicon } = config.html;
    const getDefaultFavicon = () =>
      findExists(
        ICON_EXTENSIONS.map(ext =>
          path.resolve(
            appContext.appDirectory,
            configDir || './config',
            `favicon.${ext}`,
          ),
        ),
      );
    return favicon || getDefaultFavicon() || undefined;
  }
}

export function initSourceConfig(
  config: AppNormalizedConfig,
  appContext: AppToolsContext,
) {
  config.source.include = createBuilderInclude(config, appContext);
}

function createBuilderInclude(
  config: AppNormalizedConfig,
  appContext: AppToolsContext,
) {
  const { include } = config.source;
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

  return transformInclude;
}
