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
  context,
  builderConfig,
  bundlerConfigs,
  inspectOptions,
  builderOptions,
}: {
  context: Context;
  builderConfig: string;
  bundlerConfigs: string[];
  inspectOptions: InspectConfigOptions;
  builderOptions: Required<CreateBuilderOptions>;
}) {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: chalk } = await import('@modern-js/utils/chalk');

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  const files = [
    {
      path: join(outputPath, 'builder.config.js'),
      label: 'Builder Config',
      content: builderConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const target = builderOptions.target[index];
      const outputFile = `webpack.config.${target}.js`;
      return {
        path: join(outputPath, outputFile),
        label: `Webpack Config (${target})`,
        content,
      };
    }),
  ];

  await Promise.all(
    files.map(item =>
      fs.outputFile(item.path, `module.exports = ${item.content}`),
    ),
  );

  const fileInfos = files
    .map(
      item =>
        `  - ${chalk.bold.yellow(item.label)}: ${chalk.underline(item.path)}`,
    )
    .join('\n');

  logger.success(
    `Inspect config succeed, open following files to view the content: \n\n${fileInfos}\n`,
  );
}

export async function inspectConfig({
  context,
  pluginStore,
  builderOptions,
  bundlerConfigs,
  inspectOptions = {},
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: WebpackConfig[];
}) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  } else if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const webpackConfigs =
    bundlerConfigs ||
    (
      await initConfigs({
        context,
        pluginStore,
        builderOptions,
      })
    ).webpackConfigs;

  const rawBuilderConfig = await stringifyConfig(
    context.config,
    inspectOptions.verbose,
  );
  const rawBundlerConfigs = await Promise.all(
    webpackConfigs.map(config =>
      stringifyConfig(config, inspectOptions.verbose),
    ),
  );

  if (inspectOptions.writeToDisk) {
    await writeConfigFiles({
      context,
      builderConfig: rawBuilderConfig,
      bundlerConfigs: rawBundlerConfigs,
      inspectOptions,
      builderOptions,
    });
  }

  return {
    builderConfig: rawBuilderConfig,
    bundlerConfigs: rawBundlerConfigs,
  };
}
