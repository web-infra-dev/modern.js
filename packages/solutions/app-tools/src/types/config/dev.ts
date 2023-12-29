import type { UniBuilderConfig } from '@modern-js/uni-builder';

type BuilderDevConfig = Required<UniBuilderConfig>['dev'];

export type DevProxyOptions = string | Record<string, string>;

export interface DevUserConfig extends BuilderDevConfig {
  /**
   * Used to configure a global proxy based on whistle in the development environment,
   * which can be used to view and modify HTTP/HTTPS requests, responses, and can also be used as a proxy server.
   *
   * @requires `proxy` plugin.
   * This configuration is provided by `proxy` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   */
  proxy?: string | Record<string, string>;
}
