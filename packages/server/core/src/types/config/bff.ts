import type { HttpMethodDecider } from '@modern-js/types';

export interface BffUserConfig {
  prefix?: string;
  httpMethodDecider?: HttpMethodDecider;
  enableHandleWeb?: boolean;
  crossProject?: boolean;
}

export type BffNormalizedConfig = BffUserConfig;
