import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { logger, printBuildError } from '@modern-js/utils';
import { generateRoutes } from '../utils/routes';
import { buildServerConfig } from '../utils/config';
import type { BuildOptions } from '../utils/types';
import type { AppHooks } from '../hooks';

export const build = async (
  api: PluginAPI<AppHooks>,
  options?: BuildOptions,
) => {
  if (options?.analyze) {
    process.env.BUNDLE_ANALYZE = 'true';
  }

  let resolvedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();
  const hookRunners = api.useHookRunners();
  const { apiOnly } = appContext;

  if (apiOnly) {
    const { appDirectory, distDirectory, serverConfigFile } = appContext;
    await hookRunners.beforeBuild({
      // "null" bundlerConfigs
      bundlerConfigs: undefined,
    });

    await buildServerConfig({
      appDirectory,
      distDirectory,
      configFile: serverConfigFile,
    });

    await generateRoutes(appContext);

    await hookRunners.afterBuild({
      // "null" stats
      stats: undefined,
    });

    return;
  }

  resolvedConfig = { ...resolvedConfig, cliOptions: options };
  ResolvedConfigContext.set(resolvedConfig);

  const { distDirectory, appDirectory, serverConfigFile } = appContext;

  await buildServerConfig({
    appDirectory,
    distDirectory,
    configFile: serverConfigFile,
  });

  try {
    logger.info('Create a production build...\n');

    await appContext.builder?.build();
  } catch (error) {
    printBuildError(error as Error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
