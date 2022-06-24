import {
  webpack,
  Configuration,
  getWebpackConfig,
  WebpackConfigTarget,
} from '@modern-js/webpack';
import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import {
  formatWebpackMessages,
  measureFileSizesBeforeBuild,
  printFileSizesAfterBuild,
  printBuildError,
  logger,
  isUseSSRBundle,
  emptyDir,
} from '@modern-js/utils';
import { generateRoutes } from '../utils/routes';
import { buildServerConfig, emitResolvedConfig } from '../utils/config';
import type { BuildOptions } from '../utils/types';

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

export const build = async (api: PluginAPI, options?: BuildOptions) => {
  let resolvedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();
  const hookRunners = api.useHookRunners();
  const { apiOnly } = appContext;

  if (apiOnly) {
    const { appDirectory, distDirectory, serverConfigFile } = appContext;
    await emptyDir(distDirectory);
    await hookRunners.beforeBuild({
      webpackConfigs: [],
    });

    await buildServerConfig({
      appDirectory,
      distDirectory,
      configFile: serverConfigFile,
    });

    await generateRoutes(appContext);

    await hookRunners.afterBuild();

    return;
  }

  const webpackBuild = async (webpackConfig: Configuration, type?: string) => {
    const compiler = webpack(webpackConfig);

    return new Promise((resolve, reject) => {
      let label = process.env.NODE_ENV || '';
      if (type && type !== 'legacy') {
        label += ` ${type}`;
      }
      logger.info(`Creating a ${label} build...`);

      compiler.run((err, stats) => {
        let messages: {
          errors: any;
          warnings: any;
        };
        if (!err) {
          messages = formatWebpackMessages(
            stats!.toJson({ all: false, warnings: true, errors: true }),
          );

          if (messages.errors.length === 0) {
            logger.info(`File sizes after ${label} build:\n`);
            printFileSizesAfterBuild(
              stats,
              previousFileSizes,
              distDirectory,
              WARN_AFTER_BUNDLE_GZIP_SIZE,
              WARN_AFTER_CHUNK_GZIP_SIZE,
            );
            logger.log();
          }
        }

        // When using run or watch, call close and wait for it to finish before calling run or watch again.
        // Concurrent compilations will corrupt the output files.
        compiler.close(closeErr => {
          if (closeErr) {
            logger.error(closeErr);
          }
          if (err) {
            reject(err);
          } else {
            if (messages.errors.length) {
              reject(new Error(messages.errors.join('\n\n')));
              return;
            }
            resolve({ warnings: messages.warnings });
          }
        });
      });
    });
  };

  resolvedConfig = { ...resolvedConfig, cliOptions: options };
  ResolvedConfigContext.set(resolvedConfig);

  const { distDirectory, appDirectory, serverConfigFile } = appContext;
  const previousFileSizes = await measureFileSizesBeforeBuild(distDirectory);
  await emptyDir(distDirectory);

  await buildServerConfig({
    appDirectory,
    distDirectory,
    configFile: serverConfigFile,
  });

  const buildConfigs: Array<{ type: string; config: any }> = [];
  buildConfigs.push({
    type: 'legacy',
    config: getWebpackConfig(
      WebpackConfigTarget.CLIENT,
      appContext,
      resolvedConfig,
    )!,
  });

  if (resolvedConfig.output.enableModernMode) {
    buildConfigs.push({
      type: 'modern',
      config: getWebpackConfig(
        WebpackConfigTarget.MODERN,
        appContext,
        resolvedConfig,
      )!,
    });
  }

  if (isUseSSRBundle(resolvedConfig)) {
    buildConfigs.push({
      type: 'ssr',
      config: getWebpackConfig(
        WebpackConfigTarget.NODE,
        appContext,
        resolvedConfig,
      )!,
    });
  }

  await hookRunners.beforeBuild({
    webpackConfigs: buildConfigs.map(({ config }) => config),
  });

  for (const buildConfig of buildConfigs) {
    const { type: buildType, config } = buildConfig;
    try {
      await webpackBuild(config, buildType);
    } catch (error) {
      printBuildError(error as Error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  await generateRoutes(appContext);
  await hookRunners.afterBuild();
  await emitResolvedConfig(appDirectory, resolvedConfig);
};
