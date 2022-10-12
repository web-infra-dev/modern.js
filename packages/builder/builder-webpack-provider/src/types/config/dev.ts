import type { DevServerHttpsOptions } from '@modern-js/types';
import type { IProgressOptions } from '../../webpackPlugins/ProgressPlugin';

export interface DevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
  startUrl?: boolean | string | string[];
  assetPrefix?: string | boolean;
  progressBar?: boolean | IProgressOptions;
}
