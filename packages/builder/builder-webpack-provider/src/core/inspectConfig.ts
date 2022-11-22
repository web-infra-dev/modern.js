import { join, isAbsolute } from 'path';
import { stringifyConfig } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  InspectConfigOptions,
  outputInspectConfigFiles,
} from '@modern-js/builder-shared';
import type { WebpackConfig } from '../types';

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
      configType: 'webpack',
    });
  }

  return {
    builderConfig: rawBuilderConfig,
    bundlerConfigs: rawBundlerConfigs,
  };
}
