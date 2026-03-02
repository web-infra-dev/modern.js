import { parseRspackConfig } from '@modern-js/builder';
import { createConfigOptions } from '@modern-js/plugin/cli';
import { updateBuilderWithEnvironments } from './builder/generator/getBuilderEnvironments';
import {
  builderPluginAdapterBasic,
  builderPluginAdapterHooks,
} from './builder/shared/builderPlugins';
import { DEFAULT_CONFIG_FILE } from './constants';
import type { AppNormalizedConfig, AppTools } from './types';
import { getConfigFile } from './utils/getConfigFile';

const MODERN_META_NAME = 'modern-js';

type ResolveModernRsbuildConfigOptions = {
  command?: string;
  configPath?: string;
  cwd?: string;
  modifyModernConfig?: (
    config: AppNormalizedConfig,
  ) => Promise<AppNormalizedConfig>;
};

export async function resolveModernRsbuildConfig(
  options: ResolveModernRsbuildConfigOptions = {},
) {
  const { cwd = process.cwd() } = options;

  const configFile = options.configPath || getConfigFile(undefined, cwd);

  if (!configFile) {
    throw new Error(
      `Cannot find config file in ${cwd}. Please make sure you have a ${DEFAULT_CONFIG_FILE} file in your project.`,
    );
  }

  const { config: resolvedConfig, getAppContext } =
    await createConfigOptions<AppTools>({
      command: options.command,
      cwd,
      configFile,
      metaName: MODERN_META_NAME,
    });

  let modernConfig = resolvedConfig;
  if (options.modifyModernConfig) {
    modernConfig = await options.modifyModernConfig(resolvedConfig);
  }

  const nonStandardConfig = {
    ...modernConfig,
    plugins: modernConfig.builderPlugins,
  };

  const appContext = getAppContext();

  const builderConfig = updateBuilderWithEnvironments(
    modernConfig as AppNormalizedConfig,
    appContext,
    nonStandardConfig,
  );

  const { rsbuildConfig, rsbuildPlugins } = await parseRspackConfig(
    builderConfig,
    {
      cwd,
    },
  );

  const adapterParams = {
    appContext,
    normalizedConfig: modernConfig as AppNormalizedConfig,
  };

  rsbuildConfig.plugins = [
    ...rsbuildPlugins,
    ...(rsbuildConfig.plugins || []),
    builderPluginAdapterBasic(adapterParams),
    builderPluginAdapterHooks(adapterParams),
  ];

  return { rsbuildConfig };
}

export type { ResolveModernRsbuildConfigOptions };
