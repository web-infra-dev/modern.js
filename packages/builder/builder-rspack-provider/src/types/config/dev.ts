import type { DevServerHttpsOptions } from '@modern-js/types';

export interface DevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
  startUrl?: boolean | string | string[];
  assetPrefix?: string | boolean;
  // todo options
  progressBar?: boolean;
}

export type NormalizedDevConfig = Required<DevConfig>;
