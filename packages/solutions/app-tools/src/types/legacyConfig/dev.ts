import type { DevServerHttpsOptions } from '@modern-js/types';

export type DevProxyOptions = string | Record<string, string>;

export type DevUserLegacyConfig = {
  assetPrefix?: string | boolean;
  https?: DevServerHttpsOptions;

  /**
   * The configuration of `dev.proxy` is provided by `proxy` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `proxy` plugin
   */
  proxy?: DevProxyOptions;
};
