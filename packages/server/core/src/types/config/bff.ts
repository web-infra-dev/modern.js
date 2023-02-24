import type { Options } from 'http-proxy-middleware';

export interface BffUserConfig {
  prefix?: string;
  proxy?: Record<string, Options>;
  enableHandleWeb?: boolean;
}

export type BffNormalizedConfig = BffUserConfig;
