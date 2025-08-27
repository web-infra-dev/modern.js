import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import { type Alias, logger } from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';
import type { AppTools } from '../types';
import { buildServerConfig } from '../utils/config';
import { loadServerPlugins } from '../utils/loadPlugins';
import { registerCompiler } from '../utils/register';
import { generateRoutes } from '../utils/routes';
import type { BuildOptions } from '../utils/types';

export const build = async (
  api: CLIPluginAPI<AppTools<'shared'>>,
  options?: BuildOptions,
) => {
  if (options?.analyze) {
    // Builder will read this env var to enable bundle analyzer
    process.env.BUNDLE_ANALYZE = 'true';
  }

  const resolvedConfig = api.getNormalizedConfig();
  const appContext = api.getAppContext();
  const hooks = api.getHooks();

  const combinedAlias = []
    .concat(resolvedConfig?.resolve?.alias)
    .concat(resolvedConfig?.source?.alias) as ConfigChain<Alias>;

  // we need load server plugin to appContext for ssg & deploy commands.
  await loadServerPlugins(api, appContext.appDirectory, appContext.metaName);

  if (appContext.moduleType && appContext.moduleType === 'module') {
    const { registerEsm } = await import('../esm/register-esm.mjs');
    await registerEsm({
      appDir: appContext.appDirectory,
      distDir: appContext.distDirectory,
      alias: combinedAlias,
    });
  }

  await registerCompiler(
    appContext.appDirectory,
    appContext.distDirectory,
    combinedAlias,
  );

  const { apiOnly } = appContext;

  if (apiOnly) {
    const { appDirectory, distDirectory, serverConfigFile } = appContext;
    await hooks.onBeforeBuild.call({
      environments: {},
      // "null" bundlerConfigs
      bundlerConfigs: undefined,
      isFirstCompile: false,
      isWatch: false,
    });

    await buildServerConfig({
      appDirectory,
      distDirectory,
      configFile: serverConfigFile,
    });

    await generateRoutes(appContext);

    await hooks.onAfterBuild.call({
      environments: {},
      // "null" stats
      stats: undefined,
      isFirstCompile: false,
      isWatch: false,
    });

    return;
  }

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
  await appContext.builder.build({
    watch: options?.watch,
  });
};
