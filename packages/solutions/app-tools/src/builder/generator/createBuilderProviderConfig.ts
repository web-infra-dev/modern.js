import type { IncomingMessage } from 'node:http';
import { DEFAULT_API_PREFIX } from '@modern-js/utils';
import type { AppNormalizedConfig, Bundler } from '../../types';
import type { AppToolsContext } from '../../types/new';
import { createUploadPattern } from './createCopyPattern';

function modifyOutputConfig<B extends Bundler>(
  config: AppNormalizedConfig<B>,
  appContext: AppToolsContext<B>,
) {
  const defaultCopyPattern = createUploadPattern(appContext, config);
  const { copy } = config.output;
  const copyOptions = Array.isArray(copy) ? copy : copy?.patterns;
  const builderCopy = [...(copyOptions || []), defaultCopyPattern];

  config.output = {
    ...config.output,
    copy: builderCopy,
  };
}

export function createBuilderProviderConfig<B extends Bundler>(
  resolveConfig: AppNormalizedConfig<B>,
  appContext: AppToolsContext<B>,
): Omit<AppNormalizedConfig<B>, 'plugins'> {
  const htmlConfig = { ...resolveConfig.html };
  if (!htmlConfig.template) {
    htmlConfig.templateByEntries = {
      ...appContext.htmlTemplates,
      ...htmlConfig.templateByEntries,
    };
  }
  const config = {
    ...resolveConfig,
    plugins: [],
    resolve: {
      ...resolveConfig.resolve,
    },
    dev: {
      ...resolveConfig.dev,
      port: appContext.port,
    },
    server: resolveConfig.server,
    html: htmlConfig,
    output: {
      ...resolveConfig.output,
      // We need to do this in the app-tools prepare hook because some files will be generated into the dist directory in the analyze process
      cleanDistPath: false,
    },
    tools: {
      ...resolveConfig.tools,
      devServer: {
        ...resolveConfig.tools?.devServer,
        compress: {
          filter: (req: IncomingMessage) => {
            const bffPrefix = resolveConfig.bff?.prefix || DEFAULT_API_PREFIX;
            const url = req.url;

            if (url?.startsWith(bffPrefix)) {
              return false;
            }

            return true;
          },
        },
      },
    },
  };

  modifyOutputConfig(config, appContext);

  return config as AppNormalizedConfig<B>;
}
