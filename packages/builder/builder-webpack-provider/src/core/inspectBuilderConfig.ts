import { join, isAbsolute } from 'path';
import { stringifyConfig } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import { logger, InspectConfigOptions } from '@modern-js/builder-shared';
import type { Context } from '../types';

async function writeConfigFile({
  config,
  context,
  inspectOptions,
}: {
  config: string;
  context: Context;
  inspectOptions: InspectConfigOptions;
}) {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: chalk } = await import('@modern-js/utils/chalk');

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  const filePath = join(outputPath, `builder.config.js`);
  await fs.outputFile(filePath, `module.exports = ${config}`);

  logger.info(
    `Inspect builder config succeed, open following files to view the content:\n\n  - ${chalk.yellow(
      filePath,
    )}\n`,
  );
}

export async function stringifyBuilderConfig({
  context,
  inspectOptions,
}: {
  context: Context;
  inspectOptions: InspectConfigOptions;
}) {
  const formattedBuilderConfig = await stringifyConfig(
    context.config,
    inspectOptions.verbose,
  );

  if (inspectOptions.writeToDisk) {
    await writeConfigFile({
      config: formattedBuilderConfig,
      context,
      inspectOptions,
    });
  }

  return formattedBuilderConfig;
}

export async function inspectBuilderConfig({
  context,
  pluginStore,
  builderOptions,
  inspectOptions,
}: InitConfigsOptions & { inspectOptions: InspectConfigOptions }) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  }

  await initConfigs({
    context,
    pluginStore,
    builderOptions,
  });

  return stringifyBuilderConfig({
    context,
    inspectOptions,
  });
}
