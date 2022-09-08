import type { DevServerHttpsOptions } from '@modern-js/server';

export interface DevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
  assetPrefix?: string | boolean;
  startUrl?: boolean | string | string[];
}
