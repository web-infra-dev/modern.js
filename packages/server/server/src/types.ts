import type { UniBuilderInstance } from '@modern-js/uni-builder';
import type { DevServerOptions, DevServerHttpsOptions } from '@modern-js/types';

import {
  NodeServer,
  ServerBase,
  ServerBaseOptions,
} from '@modern-js/server-core';

export type { DevServerOptions, DevServerHttpsOptions };

export type ExtraOptions = {
  dev: Pick<DevServerOptions, 'watch' | 'https'> & {
    port?: number;
    host?: string;
  };

  runCompile?: boolean;

  /** compat, the default value is modern.server-runtime.config.ts  */
  serverConfigFile?: string;

  serverConfigPath?: string;

  builder?: UniBuilderInstance;
};

export type ModernDevServerOptions<
  O extends ServerBaseOptions = ServerBaseOptions,
> = O & ExtraOptions;

export type ApplyPlugins<O extends ServerBaseOptions = ServerBaseOptions> = (
  server: ServerBase,
  options: O,
  nodeServer?: NodeServer,
) => Promise<void>;
