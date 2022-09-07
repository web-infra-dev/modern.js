import { join, isAbsolute } from 'path';
import { info, stringifyConfig } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Context, BuilderOptions, InspectOptions } from '../types';

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

  info(
    `Inspect webpack config succeed, you can open following files to view the content: \n\n${fileInfos}\n`,
  );
}

export async function inspectWebpackConfig({
  context,
  pluginStore,
  builderOptions,
  inspectOptions,
}: InitConfigsOptions & { inspectOptions: InspectOptions }) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  }

  const { webpackConfigs } = await initConfigs({
    context,
    pluginStore,
    builderOptions,
  });

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
