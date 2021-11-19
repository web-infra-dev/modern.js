import { Configuration, webpack } from 'webpack';
import { WebpackConfigTarget, getWebpackConfig } from '@modern-js/webpack';
import {
  useAppContext,
  useResolvedConfigContext,
  mountHook,
} from '@modern-js/core';
import {
  fs,
  formatWebpackMessages,
  measureFileSizesBeforeBuild,
  printFileSizesAfterBuild,
  printBuildError,
  logger,
  isUseSSRBundle,
} from '@modern-js/utils';

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

export const build = async () => {
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
              outputPath,
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

  /* eslint-disable react-hooks/rules-of-hooks */
  const resolvedConfig = useResolvedConfigContext();
  const appContext = useAppContext();
  /* eslint-enable react-hooks/rules-of-hooks */

  const outputPath = appContext.distDirectory;
  const previousFileSizes = await measureFileSizesBeforeBuild(outputPath);
  fs.emptyDirSync(outputPath);

  const buildConfigs = [];

  buildConfigs.push({
    type: 'legacy',
    config: getWebpackConfig(WebpackConfigTarget.CLIENT)!,
  });

  if (resolvedConfig.output.enableModernMode) {
    buildConfigs.push({
      type: 'modern',
      config: getWebpackConfig(WebpackConfigTarget.MODERN)!,
    });
  }

  if (isUseSSRBundle(resolvedConfig)) {
    buildConfigs.push({
      type: 'ssr',
      config: getWebpackConfig(WebpackConfigTarget.NODE)!,
    });
  }

  await (mountHook() as any).beforeBuild({
    webpackConfigs: buildConfigs.map(({ config }) => config),
  });

  for (const buildConfig of buildConfigs) {
    const { type: buildType, config } = buildConfig;
    try {
      await webpackBuild(config, buildType);
    } catch (error) {
      printBuildError(error as Error);
    }
  }
  await (mountHook() as any).afterBuild();
};
