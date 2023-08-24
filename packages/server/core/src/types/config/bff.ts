import type { Options } from 'http-proxy-middleware';
import type { HttpMethodDecider } from '@modern-js/types';

export interface BffUserConfig {
  prefix?: string;
  proxy?: Record<string, Options>;
  httpMethodDecider?: HttpMethodDecider;
  enableHandleWeb?: boolean;
}

export type BffNormalizedConfig = BffUserConfig;
