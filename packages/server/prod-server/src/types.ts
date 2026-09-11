import type {
  CreateDefaultPluginsOptions,
  ServerBaseOptions,
  ServerPlugin,
} from '@modern-js/server-core';
import type { SSRResourceApplicationOptions } from '@modern-js/server-core/node';
import type { Reporter } from '@modern-js/types';
import type { Logger } from '@modern-js/utils';

interface ProdServerExtraOptions {
  ssrApplication?: SSRResourceApplicationOptions;
  serverConfigPath: string;
  plugins?: ServerPlugin[];
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
