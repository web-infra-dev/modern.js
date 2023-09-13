import {
  appTools,
  mergeConfig,
  type AppTools,
  type UserConfig,
} from '@modern-js/app-tools';

export const applyBaseConfig = (
  config: UserConfig<AppTools<'rspack'>> = {},
) => {
  return mergeConfig([
    {
      output: {
        // disable polyfill and ts checker to make test faster
        polyfill: 'off',
        disableTsChecker: true,
      },
      plugins: [appTools({ bundler: 'experimental-rspack' })],
    },
    config,
  ]);
};
