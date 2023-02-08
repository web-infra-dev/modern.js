import type { AppNormalizedConfig, Bundler, IAppContext } from '../../types';

export function createBuilderProviderConfig<B extends Bundler>(
  resolveConfig: AppNormalizedConfig<B>,
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
    output: {
      ...resolveConfig.output,
      // We need to do this in the app-tools prepare hook because some files will be generated into the dist directory in the analyze process
      cleanDistPath: false,
    },
  };

  modifyBuilderConfig?.(config as AppNormalizedConfig<B>);

  return config as AppNormalizedConfig<B>;
}
