import { join, isAbsolute } from 'path';
import { info } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { BuilderOptions, Context, WebpackConfig } from '../types';

export type InspectOptions = {
  env?: 'development' | 'production';
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export async function formatWebpackConfig(
  config: WebpackConfig,
  verbose?: boolean,
) {
  const { default: webpackChain } = await import(
    '@modern-js/utils/webpack-chain'
  );
  const stringify = webpackChain.toString as (
    config: WebpackConfig,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config, { verbose });
}

async function writeConfigFiles({
  configs,
  context,
  inspectOptions,
  builderOptions,
}: {
  configs: string[];
  context: Context;
  inspectOptions: InspectOptions;
  builderOptions: Required<BuilderOptions>;
}) {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: chalk } = await import('@modern-js/utils/chalk');

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  const filePaths = configs.map((_, index) => {
    const target = builderOptions.target[index];
    const outputFile = `webpack.${target}.inspect.js`;
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

  info(
    `Inspect succeed, you can open following files to view the full webpack config: \n\n${fileInfos}\n`,
  );
}

export async function inspectWebpackConfig({
  context,
  pluginStore,
  builderOptions,
  inspectOptions,
}: InitConfigsOptions & { inspectOptions: InspectOptions }) {
  process.env.NODE_ENV = inspectOptions.env;

  const { webpackConfigs } = await initConfigs({
    context,
    pluginStore,
    builderOptions,
  });

  const formattedConfigs = await Promise.all(
    webpackConfigs.map(config =>
      formatWebpackConfig(config, inspectOptions.verbose),
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
