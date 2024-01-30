import { Server, ModernServerOptions } from '@modern-js/prod-server';
import type { ModernDevServerOptionsOld } from '../types';
import { ModernDevServer } from './devServerOld';
import { ModernDevServer as ModernDevServerForRsbuild } from './devServer';

const createDevServer = (options: ModernServerOptions) => {
  return new ModernDevServer(options as ModernDevServerOptionsOld);
};

// It should be replaced by DevServerForRsbuild when rsbuild is fully integrated into modern.js
export class DevServer extends Server {
  constructor(options: ModernDevServerOptionsOld) {
    super(options);

    if (options.dev) {
      this.serverImpl = createDevServer;
    }
  }
}

export class DevServerForRsbuild extends Server {
  constructor(options: ModernDevServerOptionsOld) {
    super(options);

    if (options.dev) {
      this.serverImpl = options =>
        new ModernDevServerForRsbuild(options as ModernDevServerOptionsOld);
    }
  }
}
