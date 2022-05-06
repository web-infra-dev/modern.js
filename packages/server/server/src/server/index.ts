import { Server, ModernServerOptions } from '@modern-js/prod-server';
import { ModernDevServerOptions } from '../types';
import { ModernDevServer } from './dev-server';
import { ModernAPIDevServer, ModernSSRDevServer } from './dev-server-split';

const createDevServer = (options: ModernServerOptions) => {
  if (options.apiOnly) {
    return new ModernAPIDevServer(options);
  } else if (options.ssrOnly) {
    return new ModernSSRDevServer(options);
  } else {
    return new ModernDevServer(options);
  }
};

export class DevServer extends Server {
  constructor(options: ModernDevServerOptions) {
    super(options);

    if (options.dev) {
      this.serverImpl = createDevServer;
    }
  }
}
