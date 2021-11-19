import {
  IncomingMessage,
  ServerResponse,
  createServer,
  Server as httpServer,
} from 'http';
import { createServer as createHttpsServer } from 'https';
import { serverManager } from '@modern-js/server-plugin';
import { logger as defaultLogger } from '@modern-js/utils';
import { ModernServerOptions, ServerHookRunner, ReadyOptions } from '../type';
import { ModernServer } from './modern-server';
import type { ModernDevServer } from './dev-server';
import { measure as defaultMeasure } from '@/libs/measure';

export class Server {
  public options: ModernServerOptions;

  private server!: ModernServer | ModernDevServer;

  private app!: httpServer;

  private runner!: ServerHookRunner;

  constructor(options: ModernServerOptions) {
    this.options = options;
    options.plugins?.forEach(p => {
      serverManager.usePlugin(p);
    });
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
    this.runner = await serverManager.init({});

    const { logger, measure } = await this.runner.create(
      {
        loggerOptions: options.logger,
        measureOptions: options.measure,
      },
      { onLast: () => ({} as any) },
    );

    options.logger = options.logger || logger || defaultLogger;
    options.measure = options.measure || measure || defaultMeasure;

    if (options.dev) {
      this.server = this.createDevServer();

      // check if https is configured when start dev server
      const devHttpsOption =
        typeof options.dev === 'object' && options.dev.https;
      if (devHttpsOption) {
        const { genHttpsOptions } = require('@/dev-tools/https');
        const httpsOptions = await genHttpsOptions(devHttpsOption);
        this.app = createHttpsServer(httpsOptions, this.getRequestHandler());
      } else {
        this.app = createServer(this.getRequestHandler());
      }
    } else {
      this.server = this.createProdServer();
      this.app = createServer(this.getRequestHandler());
    }

    await this.server.init();
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
      const { APIModernServer } = require('./api-server');
      return new APIModernServer(options, this.runner);
    } else if (options.webOnly) {
      const { WebModernServer } = require('./web-server');
      return new WebModernServer(options, this.runner);
    } else {
      return new ModernServer(options, this.runner);
    }
  }

  private createDevServer() {
    const { options } = this;

    if (options.apiOnly) {
      const { APIModernDevServer } = require('./api-server');
      return new APIModernDevServer(options, this.runner);
    } else if (options.webOnly) {
      const { WebModernDevServer } = require('./web-server');
      return new WebModernDevServer(options, this.runner);
    } else {
      const { ModernDevServer } = require('./dev-server');
      return new ModernDevServer(options, this.runner);
    }
  }
}
