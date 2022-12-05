import { join, isAbsolute } from 'path';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  InspectConfigOptions,
  outputInspectConfigFiles,
} from '@modern-js/builder-shared';
import type { RspackConfig } from '../types';

function stringifyConfig(config: Record<string, any>): string {
  return JSON.stringify(
    config,
    (_key, value: Record<string, any> | any) => {
      // shorten long functions
      if (typeof value === 'function') {
        const content = value.toString();
        if (content.length > 100) {
          return `function ${value.name}() { /* omitted long function */ }`;
        }
        return content;
      }

      return value;
    },
    2,
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
