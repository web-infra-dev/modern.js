import type { DevServerHttpsOptions } from '@modern-js/types';

export type ProgressBarConfig = {
  id?: string;
  quiet?: boolean;
  quietOnDev?: boolean;
};

export interface SharedDevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
  startUrl?: boolean | string | string[];
  assetPrefix?: string | boolean;
  progressBar?: boolean | ProgressBarConfig;
}

export type NormalizedSharedDevConfig = Required<SharedDevConfig>;
