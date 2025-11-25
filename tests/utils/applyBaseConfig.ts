import {
  type AppNormalizedConfig,
  type AppUserConfig,
  type UserConfigExport,
  appTools,
  defineConfig,
  mergeConfig,
} from '@modern-js/app-tools';

export const applyBaseConfig = (config = defineConfig({})) => {
  return mergeConfig<
    UserConfigExport<AppUserConfig>,
    UserConfigExport<AppNormalizedConfig>
  >([
    {
      output: {
        // disable polyfill and ts checker to make test faster
        polyfill: 'off',
        disableTsChecker: true,
      },
      performance: {
        buildCache: false,
      },
      plugins: [appTools()],
    },
    config,
  ]);
};
