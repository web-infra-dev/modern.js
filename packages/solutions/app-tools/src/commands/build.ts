import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { logger } from '@modern-js/utils';
import { loadServerPlugins } from '../utils/loadPlugins';
import { generateRoutes } from '../utils/routes';
import { buildServerConfig } from '../utils/config';
import type { BuildOptions } from '../utils/types';
import type { AppTools } from '../types';
import { registerCompiler } from '../utils/register';

export const build = async (
  api: PluginAPI<AppTools<'shared'>>,
  options?: BuildOptions,
) => {
  if (options?.analyze) {
    // Builder will read this env var to enable bundle analyzer
    process.env.BUNDLE_ANALYZE = 'true';
  }

  let resolvedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();
  const hookRunners = api.useHookRunners();

  // we need load server plugin to appContext for ssg & deploy commands.
  await loadServerPlugins(api, appContext.appDirectory, appContext.metaName);

  if (appContext.moduleType && appContext.moduleType === 'module') {
    const { registerEsm } = await import('../esm/register-esm.mjs');
    await registerEsm({
      appDir: appContext.appDirectory,
      distDir: appContext.distDirectory,
      alias: resolvedConfig.source?.alias,
    });
  }

  await registerCompiler(
    appContext.appDirectory,
    appContext.distDirectory,
    resolvedConfig?.source?.alias,
  );

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

  logger.info('Starting production build...');
  if (!appContext.builder) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }
  await appContext.builder.build();
};
