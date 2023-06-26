import type {
  Bundler,
  IAppContext,
  OutputUserConfig,
  AppNormalizedConfig,
} from '../../types';
import { createUploadPattern } from '../builder-webpack/createCopyPattern';

function modifyOutputConfig<B extends Bundler>(
  config: AppNormalizedConfig<B>,
  appContext: IAppContext,
) {
  const defaultCopyPattern = createUploadPattern(appContext, config);
  const { copy } = config.output as OutputUserConfig;
  const copyOptions = Array.isArray(copy) ? copy : copy?.patterns;
  const builderCopy = [...(copyOptions || []), defaultCopyPattern];

  config.output = {
    ...config.output,
    copy: builderCopy,
  };
}

export function createBuilderProviderConfig<B extends Bundler>(
  resolveConfig: AppNormalizedConfig<B>,
  appContext: IAppContext,
): AppNormalizedConfig<B> {
  const htmlConfig = { ...resolveConfig.html };
  if (!htmlConfig.template) {
    htmlConfig.templateByEntries = {
      ...appContext.htmlTemplates,
      ...htmlConfig.templateByEntries,
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

  modifyOutputConfig(config, appContext);

  return config as AppNormalizedConfig<B>;
}
