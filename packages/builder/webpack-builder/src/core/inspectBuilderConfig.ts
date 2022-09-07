import { join, isAbsolute } from 'path';
import { info, stringifyConfig } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Context, InspectOptions } from '../types';

async function writeConfigFile({
  config,
  context,
  inspectOptions,
}: {
  config: string;
  context: Context;
  inspectOptions: InspectOptions;
}) {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: chalk } = await import('@modern-js/utils/chalk');

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  const filePath = join(outputPath, `builder.config.js`);
  await fs.outputFile(filePath, `module.exports = ${config}`);

  info(
    `Inspect builder config succeed, you can open following files to view the content:\n  - ${chalk.yellow(
      filePath,
    )}\n`,
  );
}

export async function inspectBuilderConfig({
  context,
  pluginStore,
  builderOptions,
  inspectOptions,
}: InitConfigsOptions & { inspectOptions: InspectOptions }) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  }

  await initConfigs({
    context,
    pluginStore,
    builderOptions,
  });

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
