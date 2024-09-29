import type { DevServerHttpsOptions, DevServerOptions } from '@modern-js/types';
import type { Rspack, UniBuilderInstance } from '@modern-js/uni-builder';

import type {
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

  /**
   * The existing compiler can be used here.
   */
  compilier?: Rspack.Compiler | Rspack.MultiCompiler;

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
