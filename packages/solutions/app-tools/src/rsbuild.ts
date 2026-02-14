import { parseRspackConfig } from '@modern-js/builder';
import { createConfigOptions } from '@modern-js/plugin/cli';
import {
  builderPluginAdapterBasic,
  builderPluginAdapterHooks,
} from './builder/shared/builderPlugins';
import type { AppNormalizedConfig, AppTools } from './types';

const MODERN_META_NAME = 'modern-js';
const MODERN_CONFIG_FILE = 'modern.config.ts';

type ResolveModernRsbuildConfigOptions = {
  command?: string;
  configPath?: string;
  cwd?: string;
};

export async function resolveModernRsbuildConfig(
  options: ResolveModernRsbuildConfigOptions = {},
) {
  const { cwd = process.cwd() } = options;
  const { config: resolvedConfig, getAppContext } =
    await createConfigOptions<AppTools>({
      command: options.command,
      cwd,
      configFile: options.configPath || MODERN_CONFIG_FILE,
      metaName: MODERN_META_NAME,
    });

  const nonStandardConfig = {
    ...resolvedConfig,
    plugins: [resolvedConfig.builderPlugins],
  };

  const { rsbuildConfig, rsbuildPlugins } = await parseRspackConfig(
    nonStandardConfig,
    {
      cwd,
    },
  );

  const appContext = getAppContext();
  const adapterParams = {
    appContext,
    normalizedConfig: resolvedConfig as AppNormalizedConfig,
  };

  rsbuildConfig.plugins = [
    ...rsbuildPlugins,
    ...(rsbuildConfig.plugins || []),
    builderPluginAdapterBasic(adapterParams),
    builderPluginAdapterHooks(adapterParams),
  ];

  return rsbuildConfig;
}

export type { ResolveModernRsbuildConfigOptions };
