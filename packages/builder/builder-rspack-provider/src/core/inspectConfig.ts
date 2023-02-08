import { join, isAbsolute } from 'path';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  InspectConfigOptions,
  outputInspectConfigFiles,
  stringifyConfig,
} from '@modern-js/builder-shared';
import type { RspackConfig } from '../types';

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

  const rawBuilderConfig = await stringifyConfig(
    context.config,
    inspectOptions.verbose,
  );
  const rawBundlerConfigs = await Promise.all(
    rspackConfigs.map(config =>
      stringifyConfig(config, inspectOptions.verbose),
    ),
  );

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  if (inspectOptions.writeToDisk) {
    await outputInspectConfigFiles({
      builderConfig: rawBuilderConfig,
      bundlerConfigs: rawBundlerConfigs,
      inspectOptions: {
        ...inspectOptions,
        outputPath,
      },
      builderOptions,
      configType: 'rspack',
    });
  }

  return {
    builderConfig: rawBuilderConfig,
    bundlerConfigs: rawBundlerConfigs,
    origin: {
      builderConfig: context.config,
      bundlerConfigs: rspackConfigs,
    },
  };
}
