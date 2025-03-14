import type {
  CreateDefaultPluginsOptions,
  ServerBaseOptions,
  ServerPlugin,
  ServerPluginLegacy,
} from '@modern-js/server-core';
import type { Reporter } from '@modern-js/types';
import type { Logger } from '@modern-js/utils';

interface ProdServerExtraOptions {
  serverConfigPath: string;

  plugins?: (ServerPlugin | ServerPluginLegacy)[];
}

export type ProdServerOptions = ServerBaseOptions &
  ProdServerExtraOptions &
  CreateDefaultPluginsOptions;

export type BaseEnv = {
  Variables: {
    logger: Logger;
    reporter: Reporter;
  };
};
