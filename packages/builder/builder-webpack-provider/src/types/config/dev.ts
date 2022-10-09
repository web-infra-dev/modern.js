<<<<<<< HEAD
import type { DevServerHttpsOptions } from '@modern-js/types';
import type { ProgressOptions } from '../../webpackPlugins/ProgressPlugin/ProgressPlugin';
=======
import type { DevServerHttpsOptions } from '@modern-js/server';
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

export interface DevConfig {
  hmr?: boolean;
  port?: number;
  https?: DevServerHttpsOptions;
<<<<<<< HEAD
  startUrl?: boolean | string | string[];
  assetPrefix?: string | boolean;
  progressBar?: boolean | ProgressOptions;
}

export type NormalizedDevConfig = Required<DevConfig>;
=======
  assetPrefix?: string | boolean;
  startUrl?: boolean | string | string[];
}
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
