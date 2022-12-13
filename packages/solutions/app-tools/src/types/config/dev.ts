import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

type BuilderDevConfig = Required<BuilderConfig>['dev'];

export type DevProxyOptions = string | Record<string, string>;

// dev.port is omitted, using server.port instead
export interface DevUserConfig extends Omit<BuilderDevConfig, 'port'> {
  /**
   * The configuration of `dev.proxy` is provided by `proxy` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `proxy` plugin
   */
  proxy?: string | Record<string, string>;
}

export type DevNormalizedConfig = DevUserConfig;
