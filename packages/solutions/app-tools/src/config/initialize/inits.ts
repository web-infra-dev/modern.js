import path, { isAbsolute } from 'path';
import { findExists } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/new';

export function initHtmlConfig(
  config: AppNormalizedConfig<'shared'>,
  appContext: AppToolsContext<'shared'>,
): AppNormalizedConfig<'shared'>['html'] {
  const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'ico'];
  config.html.appIcon = createBuilderAppIcon(config, appContext);
  config.html.favicon = createBuilderFavicon(config, appContext);

  return config.html;

  function createBuilderAppIcon(
    config: AppNormalizedConfig<'shared'>,
    appContext: AppToolsContext<'shared'>,
  ) {
    const { appIcon } = config.html;
    const { configDir } = config.source;
    const getDefaultAppIcon = () =>
      findExists(
        ICON_EXTENSIONS.map(ext =>
          path.resolve(
            appContext.appDirectory,
            configDir || './config',
            `icon.${ext}`,
          ),
        ),
      );
    return appIcon || getDefaultAppIcon() || undefined;
  }
  function createBuilderFavicon(
    config: AppNormalizedConfig<'shared'>,
    appContext: AppToolsContext<'shared'>,
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
  config: AppNormalizedConfig<'shared'>,
  appContext: AppToolsContext<'shared'>,
  bundler: 'webpack' | 'rspack',
) {
  config.source.include = createBuilderInclude(config, appContext);
}

function createBuilderInclude(
  config: AppNormalizedConfig<'shared'>,
  appContext: AppToolsContext<'shared'>,
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
