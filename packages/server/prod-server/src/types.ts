import {
  ServerBaseOptions,
  BindRenderHandleOptions,
} from '@modern-js/server-core/base';
import { Reporter } from '@modern-js/types';
import { Logger } from '@modern-js/utils';

interface MonitorOptions {
  logger?: Logger;
}

export type ProdServerOptions = ServerBaseOptions &
  Omit<BindRenderHandleOptions, 'templates'> &
  MonitorOptions;

export type BaseEnv = {
  Variables: {
    logger: Logger;
    reporter: Reporter;
  };
};
