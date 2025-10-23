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
  const createCompressConfig = () =>
    ({
      filter: (req: IncomingMessage) => {
        const bffPrefix = resolveConfig.bff?.prefix || DEFAULT_API_PREFIX;
        const url = req.url;

        if (url?.startsWith(bffPrefix)) {
          return false;
        }

        return true;
      },
    }) satisfies { filter: (req: IncomingMessage) => boolean };

  const htmlConfig = { ...resolveConfig.html };
  if (!htmlConfig.template) {
    htmlConfig.templateByEntries = {
      ...appContext.htmlTemplates,
      ...htmlConfig.templateByEntries,
    };
  }
  const originalDevServer = resolveConfig.tools?.devServer;
  let normalizedDevServer = originalDevServer;

  const isDevServerDisabled = (originalDevServer as any) === false;

  const canNormalizeDevServer =
    originalDevServer !== undefined &&
    originalDevServer !== null &&
    typeof originalDevServer !== 'function' &&
    typeof originalDevServer !== 'boolean';

  if (canNormalizeDevServer) {
    const baseDevServer = {
      ...(originalDevServer ?? {}),
    } as Record<string, any>;

    if ((baseDevServer as { compress?: unknown }).compress === undefined) {
      (baseDevServer as { compress?: unknown }).compress =
        createCompressConfig();
    }

    normalizedDevServer = baseDevServer;
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
      ...(normalizedDevServer !== undefined
        ? {
            devServer: normalizedDevServer,
          }
        : isDevServerDisabled
          ? {
              devServer: false as any,
            }
          : {
              devServer: {
                compress: createCompressConfig(),
              },
            }),
    },
  };

  modifyOutputConfig(config, appContext);

  return config as AppNormalizedConfig<B>;
}
