import { join, isAbsolute } from 'path';
import { stringifyConfig } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  InspectConfigOptions,
  CreateBuilderOptions,
} from '@modern-js/builder-shared';
import type { Context, WebpackConfig } from '../types';

async function writeConfigFiles({
  configs,
  context,
  inspectOptions,
  builderOptions,
}: {
  configs: string[];
  context: Context;
  inspectOptions: InspectConfigOptions;
  builderOptions: Required<CreateBuilderOptions>;
}) {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: chalk } = await import('@modern-js/utils/chalk');

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  const filePaths = configs.map((_, index) => {
    const target = builderOptions.target[index];
    const outputFile = `webpack.config.${target}.js`;
    return join(outputPath, outputFile);
  });

  await Promise.all(
    configs.map((config, index) =>
      fs.outputFile(filePaths[index], `module.exports = ${config}`),
    ),
  );

  const fileInfos = filePaths
    .map(file => `  - ${chalk.yellow(file)}`)
    .join('\n');

  logger.info(
    `Inspect webpack config succeed, open following files to view the content: \n\n${fileInfos}\n`,
  );
}

export async function stringifyWebpackConfig({
  context,
  inspectOptions,
  webpackConfigs,
  builderOptions,
}: {
  context: Context;
  inspectOptions: InspectConfigOptions;
  webpackConfigs: WebpackConfig[];
  builderOptions: Required<CreateBuilderOptions>;
}) {
  const formattedConfigs = await Promise.all(
    webpackConfigs.map(config =>
      stringifyConfig(config, inspectOptions.verbose),
    ),
  );

  if (inspectOptions.writeToDisk) {
    await writeConfigFiles({
      configs: formattedConfigs,
      context,
      inspectOptions,
      builderOptions,
    });
  }

  return formattedConfigs;
}

export async function inspectBundlerConfig({
  context,
  pluginStore,
  builderOptions,
  inspectOptions,
}: InitConfigsOptions & { inspectOptions: InspectConfigOptions }) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  }

  const { webpackConfigs } = await initConfigs({
    context,
    pluginStore,
    builderOptions,
  });

  return stringifyWebpackConfig({
    context,
    webpackConfigs,
    inspectOptions,
    builderOptions,
  });
}
