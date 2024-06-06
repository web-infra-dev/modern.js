import { ServerBaseOptions, RenderPluginOptions } from '@modern-js/server-core';
import { Reporter } from '@modern-js/types';
import { Logger } from '@modern-js/utils';

interface MonitorOptions {
  logger?: Logger;
}

export type ProdServerOptions = ServerBaseOptions &
  MonitorOptions &
  RenderPluginOptions;

export type BaseEnv = {
  Variables: {
    logger: Logger;
    reporter: Reporter;
  };
};
