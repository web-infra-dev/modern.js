import type { DevServerHttpsOptions } from '@modern-js/types';

export interface DevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
  startUrl?: boolean | string | string[];
  assetPrefix?: string | boolean;
  progressBar?: boolean;
}
