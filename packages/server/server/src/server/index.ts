import { Server, ModernServerOptions } from '@modern-js/prod-server';
import type {
  ModernDevServerOptions,
  ModernDevServerOptionsNew,
} from '../types';
import { ModernDevServer } from './devServer';
import { ModernDevServer as ModernDevServerForRsbuild } from './devServerNew';

const createDevServer = (options: ModernServerOptions) => {
  return new ModernDevServer(options as ModernDevServerOptions);
};

// It should be replaced by DevServerForRsbuild when rsbuild is fully integrated into modern.js
export class DevServer extends Server {
  constructor(options: ModernDevServerOptions) {
    super(options);

    if (options.dev) {
      this.serverImpl = createDevServer;
    }
  }
}

export class DevServerForRsbuild extends Server {
  constructor(options: ModernDevServerOptionsNew) {
    super(options);

    if (options.dev) {
      this.serverImpl = options =>
        new ModernDevServerForRsbuild(options as ModernDevServerOptionsNew);
    }
  }
}
