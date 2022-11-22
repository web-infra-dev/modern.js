import { Server } from 'http';
import { EventEmitter } from 'events';
import { Compiler, MultiCompiler } from 'webpack';
import webpackDevMiddleware from '@modern-js/utils/webpack-dev-middleware';
import {
  DevServerOptions,
  DevMiddlewareAPI,
  CustomDevMiddleware,
} from '../../types';
import DevServerPlugin from './dev-server-plugin';
import SocketServer from './socket-server';

type Options = {
  compiler: MultiCompiler | Compiler | null;
  dev: DevServerOptions;
  devMiddleware?: CustomDevMiddleware;
};

const noop = () => {
  // noop
};

export default class DevMiddleware extends EventEmitter {
  public middleware?: DevMiddlewareAPI;

  private compiler: MultiCompiler | Compiler | null;

  private devOptions: DevServerOptions;

  private socketServer: SocketServer;

  constructor({ compiler, dev, devMiddleware }: Options) {
    super();

    this.compiler = compiler;
    this.devOptions = dev;

    // init socket server
    this.socketServer = new SocketServer(dev);

    // Todo: should remove after abstract dev middleware
    if (this.compiler) {
      // setup compiler in server, also add dev-middleware to handler static file in memory
      // set up plugin to each compiler
      this.setupDevServerPlugin();
      // register hooks for each compilation, update socket stats if recompiled
      this.setupHooks();
      // start dev middleware
      this.middleware = this.setupDevMiddleware(devMiddleware);
    }
  }

  public init(app: Server) {
    app.on('listening', () => {
      this.socketServer.prepare(app);
    });

    app.on('close', async () => {
      this.middleware?.close(noop);
      this.socketServer.close();
    });
  }

  private setupDevServerPlugin() {
    const { devOptions } = this;

    // apply dev server to client compiler, add hmr client to entry.
    if ((this.compiler as MultiCompiler).compilers) {
      (this.compiler as MultiCompiler).compilers.forEach(target => {
        if (this.isClientCompiler(target)) {
          new DevServerPlugin(devOptions).apply(target);
        }
      });
    } else {
      new DevServerPlugin(devOptions).apply(this.compiler as Compiler);
    }
  }

  public sockWrite(
    type: string,
    data?: Record<string, any> | string | boolean,
  ) {
    this.socketServer.sockWrite(type, data);
  }

  private setupHooks() {
    const invalidPlugin = () => {
      this.socketServer.sockWrite('invalid');
    };

    const addHooks = (compiler: Compiler) => {
      if (compiler.name === 'server') {
        return;
      }

      const { compile, invalid, done } = compiler.hooks;

      compile.tap('modern-dev-server', invalidPlugin);
      invalid.tap('modern-dev-server', invalidPlugin);
      done.tap('modern-dev-server', (stats: any) => {
        this.socketServer.updateStats(stats);
        this.emit('change', stats);
      });
    };

    if ((this.compiler as MultiCompiler).compilers) {
      (this.compiler as MultiCompiler).compilers.forEach(addHooks);
    } else {
      addHooks(this.compiler as Compiler);
    }
  }

  private setupDevMiddleware(
    devMiddleware: CustomDevMiddleware = webpackDevMiddleware,
  ) {
    const { devOptions } = this;

    const middleware = devMiddleware(this.compiler!, {
      headers: devOptions.headers,
      stats: false,
      ...devOptions.devMiddleware,
    });

    return middleware;
  }

  private isClientCompiler(compiler: Compiler) {
    const { target } = compiler.options;

    // if target not contains `node`, it's a client compiler
    if (target) {
      if (Array.isArray(target)) {
        return !target.includes('node');
      }
      return target !== 'node';
    }

    return compiler.name === 'client';
  }
}
