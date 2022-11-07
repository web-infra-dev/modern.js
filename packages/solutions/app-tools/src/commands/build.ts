import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { logger, isUseSSRBundle, printBuildError } from '@modern-js/utils';
import { BuilderTarget } from '@modern-js/builder';
import { generateRoutes } from '../utils/routes';
import { buildServerConfig, emitResolvedConfig } from '../utils/config';
import type { BuildOptions } from '../utils/types';
import type { AppHooks } from '../hooks';
import createBuilder from '../builder';

export const build = async (
  api: PluginAPI<AppHooks>,
  options?: BuildOptions,
) => {
  let resolvedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();
  const hookRunners = api.useHookRunners();
  const { apiOnly } = appContext;

  if (apiOnly) {
    const { appDirectory, distDirectory, serverConfigFile } = appContext;
    await hookRunners.beforeBuild();

    await buildServerConfig({
      appDirectory,
      distDirectory,
      configFile: serverConfigFile,
    });

    await generateRoutes(appContext);

    await hookRunners.afterBuild();

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

  const targets: BuilderTarget[] = ['web'];
  if (resolvedConfig.output.enableModernMode) {
    targets.push('modern-web');
  }
  if (isUseSSRBundle(resolvedConfig)) {
    targets.push('node');
  }

  try {
    const builder = await createBuilder({
      target: targets,
      appContext,
      normalizedConfig: resolvedConfig,
      compatPluginConfig: {
        async onBeforeBuild() {
          await generateRoutes(appContext);
          await hookRunners.beforeBuild();
        },
        async onAfterBuild() {
          await hookRunners.afterBuild();
          await emitResolvedConfig(appDirectory, resolvedConfig);
        },
      },
    });

    logger.info('Create a production build...\n');

    await builder.build();
  } catch (error) {
    printBuildError(error as Error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
