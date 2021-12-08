import { IncomingMessage, ServerResponse, Server as httpServer } from 'http';
import path from 'path';
import { serverManager } from '@modern-js/server-plugin';
import { logger as defaultLogger } from '@modern-js/utils';
import {
  AppContext,
  initAppContext,
  initAppDir,
  loadUserConfig,
} from '@modern-js/core';
import { ModernServer } from './modern-server';
import type { ModernDevServer } from './dev-server';
import { APIModernServer, WebModernServer } from './modern-server-split';
import { ModernServerOptions, ServerHookRunner, ReadyOptions } from '@/type';
import { measure as defaultMeasure } from '@/libs/measure';

export class Server {
  public options: ModernServerOptions;

  private server!: ModernServer | ModernDevServer;

  private app!: httpServer;

  private runner!: ServerHookRunner;

  constructor(options: ModernServerOptions) {
    this.options = options;
  }

  public getRequestHandler() {
    return (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
      const requestHandler = this.server.getRequestHandler();
      return requestHandler(req, res, next);
    };
  }

  public ready(readyOptions: ReadyOptions = {}) {
    this.server.ready(readyOptions);
  }

  public async init() {
    const { options } = this;

    options.logger = options.logger || defaultLogger;
    options.measure = options.measure || defaultMeasure;

    // initialize server
    if (options.dev) {
      this.server = this.createDevServer();
    } else {
      this.server = this.createProdServer();
    }
    // check if https is configured when start dev server
    this.app = await this.server.createHTTPServer(this.getRequestHandler());

    this.runner = await this.createHookRunner();

    // runner can only be used after server init
    await this.server.init(this.runner);

    return this;
  }

  public listen(port = 8080, listener: any) {
    this.app.listen(port, () => {
      if (listener) {
        listener();
      }

      this.listener(this.app);
    });
  }

  public listener(app: httpServer) {
    this.server.onListening(app);
  }

  public async close() {
    await this.server.close();
    await new Promise<void>(resolve =>
      this.app.close(() => {
        resolve();
      }),
    );
  }

  private createProdServer() {
    const { options } = this;

    if (options.apiOnly) {
      return new APIModernServer(options);
    } else if (options.webOnly) {
      return new WebModernServer(options);
    } else {
      return new ModernServer(options);
    }
  }

  private createDevServer() {
    const { options } = this;
    const {
      APIModernDevServer,
      WebModernDevServer,
      ModernDevServer,
    } = require('./dev-server');

    if (options.apiOnly) {
      return new APIModernDevServer(options);
    } else if (options.webOnly) {
      return new WebModernDevServer(options);
    } else {
      return new ModernDevServer(options);
    }
  }

  private async createHookRunner() {
    const { options } = this;
    const appContext = await this.initAppContext();
    serverManager.run(() => {
      AppContext.set({
        ...appContext,
        distDirectory: path.join(
          options.pwd,
          options.config.output.path || 'dist',
        ),
      });
    });

    options.plugins?.forEach(p => {
      serverManager.usePlugin(p);
    });

    return serverManager.init({});
  }

  private async initAppContext() {
    const appDirectory = await initAppDir();

    const loaded = await loadUserConfig(appDirectory);

    const plugins = this.options.plugins?.map(p => ({
      server: p,
      cli: undefined,
    }));

    const appContext = initAppContext(
      appDirectory,
      plugins || [],
      loaded.filePath,
    );
    return appContext;
  }
}
