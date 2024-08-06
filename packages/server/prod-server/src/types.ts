import {
  ServerBaseOptions,
  CreateDefaultPluginsOptions,
  ServerPlugin,
} from '@modern-js/server-core';
import { Reporter } from '@modern-js/types';
import { Logger } from '@modern-js/utils';

interface ProdServerExtraOptions {
  logger?: Logger;

  /** compat modern.server-runtime.config.ts */
  serverConfigFile?: string;

  serverConfigPath?: string;

  plugins?: ServerPlugin[];
}

export type ProdServerOptions = Exclude<ServerBaseOptions, 'serverConfig'> &
  ProdServerExtraOptions &
  CreateDefaultPluginsOptions;

export type BaseEnv = {
  Variables: {
    logger: Logger;
    reporter: Reporter;
  };
};
