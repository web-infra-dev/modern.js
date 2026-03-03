import { parseRspackConfig } from '@modern-js/builder';
import { createConfigOptions } from '@modern-js/plugin/cli';
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
  metaName?: string;
  modifyModernConfig?: (
    config: AppNormalizedConfig,
  ) => Promise<AppNormalizedConfig>;
};

export async function resolveModernRsbuildConfig(
  options: ResolveModernRsbuildConfigOptions = {},
) {
  const { cwd = process.cwd(), metaName = MODERN_META_NAME } = options;

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
      metaName,
    });

  const modernConfig = options.modifyModernConfig
    ? await options.modifyModernConfig(resolvedConfig)
    : resolvedConfig;

  const nonStandardConfig = {
    ...modernConfig,
    plugins: modernConfig.builderPlugins,
  };

  const appContext = getAppContext();

  const { rsbuildConfig, rsbuildPlugins } = await parseRspackConfig(
    nonStandardConfig,
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
