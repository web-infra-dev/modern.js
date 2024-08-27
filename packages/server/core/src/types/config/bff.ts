import type { HttpMethodDecider } from '@modern-js/types';
import type { Options } from 'http-proxy-middleware';

export interface BffUserConfig {
  prefix?: string;
  proxy?: Record<string, Options>;
  httpMethodDecider?: HttpMethodDecider;
  enableHandleWeb?: boolean;
}

export type BffNormalizedConfig = BffUserConfig;
