import { Server, ModernServerOptions } from '@modern-js/prod-server';
import type { ModernDevServerOptions } from '../types';
import { ModernDevServer } from './dev-server';

const createDevServer = (options: ModernServerOptions) => {
  return new ModernDevServer(options as ModernDevServerOptions);
};

export class DevServer extends Server {
  constructor(options: ModernDevServerOptions) {
    super(options);

    if (options.dev) {
      this.serverImpl = createDevServer;
    }
  }
}
