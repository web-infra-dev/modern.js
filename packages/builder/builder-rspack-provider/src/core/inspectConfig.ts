import { join, isAbsolute } from 'path';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  InspectConfigOptions,
  CreateBuilderOptions,
} from '@modern-js/builder-shared';
import type { Context, RspackConfig } from '../types';

function stringifyConfig(config: any): string {
  return JSON.stringify(
    config,
    (_key, value: Record<string, any> | any) => {
      // shorten long functions
      if (typeof value === 'function') {
        if (value.toString().length > 100) {
          return `function ${value.name}() { /* omitted long function */ }`;
        }
        return value.toString();
      }

      return value;
    },
    2,
  );
}

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

  const { target } = builderOptions;
  const files = [
    {
      path: join(outputPath, 'builder.config.js'),
      label: 'Builder Config',
      content: builderConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const suffix = Array.isArray(target) ? target[index] : `target-${index}`;
      const outputFile = `rspack.config.${suffix}.js`;
      return {
        path: join(outputPath, outputFile),
        label: `Rspack Config (${suffix})`,
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
  bundlerConfigs?: RspackConfig[];
}) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  } else if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const rspackConfigs =
    bundlerConfigs ||
    (
      await initConfigs({
        context,
        pluginStore,
        builderOptions,
      })
    ).rspackConfigs;

  const rawBuilderConfig = stringifyConfig(context.config);
  const rawBundlerConfigs = await Promise.all(
    rspackConfigs.map(config => stringifyConfig(config)),
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
