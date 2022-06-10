import path from 'path';
import {
  Configuration,
  getWebpackConfig,
  WebpackConfigTarget,
} from '@modern-js/webpack';
import { fs, logger, signale, isUseSSRBundle, chalk } from '@modern-js/utils';
import WebpackChain from '@modern-js/utils/webpack-chain';
import type { PluginAPI, NormalizedConfig, IAppContext } from '@modern-js/core';
import type { InspectOptions } from '../utils/types';

export const formatWebpackConfig = (
  config: Configuration,
  verbose?: boolean,
) => {
  const stringify = WebpackChain.toString as (
    config: Configuration,
    options: { verbose?: boolean },
  ) => string;

  return `module.exports = ${stringify(config, { verbose })};`;
};

export const inspect = (api: PluginAPI, options: InspectOptions) => {
  process.env.NODE_ENV = options.env;

  const resolvedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();

  const outputFiles: string[] = [];

  outputFiles.push(
    printInspectResult(
      WebpackConfigTarget.CLIENT,
      appContext,
      resolvedConfig,
      options,
    ),
  );

  if (resolvedConfig.output.enableModernMode) {
    outputFiles.push(
      printInspectResult(
        WebpackConfigTarget.MODERN,
        appContext,
        resolvedConfig,
        options,
      ),
    );
  }

  if (isUseSSRBundle(resolvedConfig)) {
    outputFiles.push(
      printInspectResult(
        WebpackConfigTarget.NODE,
        appContext,
        resolvedConfig,
        options,
      ),
    );
  }

  signale.success(
    'Inspect succeed, you can open following files to view the full webpack config: \n',
  );
  outputFiles.forEach(file => {
    signale.log(
      `  - ${chalk.yellow(path.relative(appContext.appDirectory, file))}`,
    );
  });
  signale.log();
};

export const getTagByWebpackTarget = (webpackTarget: WebpackConfigTarget) => {
  switch (webpackTarget) {
    case WebpackConfigTarget.CLIENT:
      return 'client';
    case WebpackConfigTarget.MODERN:
      return 'modern';
    case WebpackConfigTarget.NODE:
      return 'ssr';
    default:
      throw Error(`Unsupported webpack target: ${webpackTarget as number}`);
  }
};

export const printInspectResult = (
  webpackTarget: WebpackConfigTarget,
  appContext: IAppContext,
  resolvedConfig: NormalizedConfig,
  options: InspectOptions,
) => {
  const webpackConfig = getWebpackConfig(
    webpackTarget,
    appContext,
    resolvedConfig,
  )!;
  const { output, verbose, console = true } = options;
  const outputPath = output
    ? path.posix.join(appContext.distDirectory, output)
    : appContext.distDirectory;

  const tag = getTagByWebpackTarget(webpackTarget);
  const outputFile = `webpack.${tag}.inspect.js`;
  const outputFilePath = path.posix.join(outputPath, outputFile);
  const rawWebpackConfig = formatWebpackConfig(webpackConfig, verbose);

  fs.outputFileSync(outputFilePath, rawWebpackConfig);

  if (console) {
    logger.log(
      `
webpack config for ${tag} build:
${rawWebpackConfig}
    `,
    );
  }

  return outputFilePath;
};
