import type { DevServerHttpsOptions } from '@modern-js/types';

export type DevProxyOptions = string | Record<string, string>;
export interface DevUserConfig {
  assetPrefix?: string | boolean;
  https?: DevServerHttpsOptions;

  /**
   * The configuration of `dev.proxy` is provided by `proxy` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `proxy` plugin
   */
  proxy?: string | Record<string, string>;
}

export type DevNormalizedConfig = DevUserConfig;
