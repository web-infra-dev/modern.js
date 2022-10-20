import type { DevServerHttpsOptions } from '@modern-js/types';

export type ProgressBarConfig = {
  id?: string;
  quite?: boolean;
  quiteOnDev?: boolean;
};

export interface SharedDevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
  startUrl?: boolean | string | string[];
  assetPrefix?: string | boolean;
  progressBar?: boolean | ProgressBarConfig;
}
