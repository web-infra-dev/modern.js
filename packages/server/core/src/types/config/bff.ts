import type { Options } from 'http-proxy-middleware';
import type { HttpMethodDecider } from '@modern-js/types';

export interface BffUserConfig {
  prefix?: string;
  proxy?: Record<string, Options>;
  httpMethodDecider?: HttpMethodDecider;
  enableHandleWeb?: boolean;
  requestCreator?: string;
}

export type BffNormalizedConfig = BffUserConfig;
