import type { AppNormalizedConfig, AppTools } from '@modern-js/app-tools';
import {
  builderPluginAdapterBasic,
  builderPluginAdapterHooks,
  parseRspackConfig as parseToRsbuildConfig,
} from '@modern-js/app-tools/builder';
import { createStorybookOptions } from '@modern-js/plugin/cli';
import type { ExtendConfigFn } from '@rstest/core';
import { toRstestExtendConfig } from './toRstestConfig';

type AdapterInitOptions = {
  configPath?: string;
  cwd?: string;
};
const MODERN_META_NAME = 'modern-js';
const MODERN_CONFIG_FILE = 'modern.config.ts';

const getModernNormalizedConfig = async (options: AdapterInitOptions) => {
  const { cwd = process.cwd() } = options;
  const { config: resolveConfig, getAppContext } =
    await createStorybookOptions<AppTools>({
      cwd,
      configFile: options.configPath || MODERN_CONFIG_FILE,
      metaName: MODERN_META_NAME,
    });

  const nonStandardConfig = {
    ...resolveConfig,
    plugins: [resolveConfig.builderPlugins],
  };
  // Parse the non-standardized config to rsbuild config
  const { rsbuildConfig, rsbuildPlugins } = await parseToRsbuildConfig(
    nonStandardConfig,
    {
      cwd,
    },
  );

  const appContext = getAppContext();
  const adapterParams = {
    appContext,
    normalizedConfig: resolveConfig as AppNormalizedConfig,
  };

  // Inject the extra rsbuild plugins
  rsbuildConfig.plugins = [
    ...rsbuildPlugins,
    ...(rsbuildConfig.plugins || []),
    builderPluginAdapterBasic(adapterParams),
    builderPluginAdapterHooks(adapterParams),
  ];

  return rsbuildConfig;
};

export function withModernConfig(
  options: AdapterInitOptions = {},
): ExtendConfigFn {
  return async () => {
    const modern = await getModernNormalizedConfig(options);

    const rstestExtendConfig = toRstestExtendConfig(modern);
    return rstestExtendConfig;
  };
}
