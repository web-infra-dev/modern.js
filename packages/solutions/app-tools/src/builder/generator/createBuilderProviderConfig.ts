import type { AppNormalizedConfig, Bundler, IAppContext } from '../../types';

export function createBuilderProviderConfig<B extends Bundler>(
  resolveConfig: AppNormalizedConfig,
  appContext: IAppContext,
  modifyBuilderConfig?: (config: AppNormalizedConfig<B>) => void,
): AppNormalizedConfig<B> {
  const htmlConfig = { ...resolveConfig.html };
  if (!htmlConfig.template) {
    htmlConfig.templateByEntries = {
      ...htmlConfig.templateByEntries,
      ...appContext.htmlTemplates,
    };
  }
  const config = {
    ...resolveConfig,
    dev: {
      ...resolveConfig.dev,
      port: appContext.port,
    },
    html: htmlConfig,
  };
  modifyBuilderConfig?.(config as AppNormalizedConfig<B>);

  return config as AppNormalizedConfig<B>;
}
