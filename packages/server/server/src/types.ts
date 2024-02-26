import type { DevServerOptions } from '@modern-js/types';
import type {
  RsbuildInstance,
  DevServerAPIs,
  DevMiddlewaresConfig,
} from '@rsbuild/shared';
import { ServerBase, ServerBaseOptions } from '@modern-js/server-core/base';

export type { DevServerOptions };

export type ExtraOptions = {
  dev: Partial<DevServerOptions>;
  useWorkerSSR?: boolean;
  rsbuild?: RsbuildInstance;
  getMiddlewares?: (
    overrides?: DevMiddlewaresConfig,
  ) => ReturnType<DevServerAPIs['getMiddlewares']>;
};

export type ModernDevServerOptions<
  O extends ServerBaseOptions = ServerBaseOptions,
> = O & ExtraOptions;

export type InitProdMiddlewares<
  O extends ServerBaseOptions = ServerBaseOptions,
> = (server: ServerBase, options: O) => Promise<ServerBase>;
