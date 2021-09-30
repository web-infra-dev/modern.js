import {
  IncomingMessage,
  ServerResponse,
  createServer,
  Server as httpServer,
} from 'http';
import { serverManager } from '@modern-js/server-plugin';
import { compatRequire, logger as defaultLogger } from '@modern-js/utils';
import { ModernServerOptions, ServerHookRunner, ReadyOptions } from '../type';
import { ModernServer } from './modern-server';
import { ModernDevServer } from './dev-server';
import { WebModernDevServer, WebModernServer } from './web-server';
import { APIModernDevServer, APIModernServer } from './api-server';
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

    if (options.config?.output?.polyfill === 'ua') {
      serverManager.usePlugin(compatRequire('@modern-js/plugin-polyfill'));
    }
  }

  public getRequestHandler() {
    return (req: IncomingMessage, res: ServerResponse) => {
      const requestHandler = this.server.getRequestHandler();
      return requestHandler(req, res);
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
    } else {
      this.server = this.createProdServer();
    }

    this.app = createServer(this.getRequestHandler());

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
      return new APIModernServer(options, this.runner);
    } else if (options.webOnly) {
      return new WebModernServer(options, this.runner);
    } else {
      return new ModernServer(options, this.runner);
    }
  }

  private createDevServer() {
    const { options } = this;

    if (options.apiOnly) {
      return new APIModernDevServer(options, this.runner);
    } else if (options.webOnly) {
      return new WebModernDevServer(options, this.runner);
    } else {
      return new ModernDevServer(options, this.runner);
    }
  }
}
