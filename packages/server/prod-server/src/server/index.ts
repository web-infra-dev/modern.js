import { IncomingMessage, ServerResponse, Server as httpServer } from 'http';
import path from 'path';
import {
  serverManager,
  AppContext,
  ConfigContext,
} from '@modern-js/server-core';
import { compatRequire, logger as defaultLogger } from '@modern-js/utils';
import { initAppContext, UserConfig } from '@modern-js/core';
import {
  ModernServerOptions,
  ServerHookRunner,
  ServerConstructor,
  ModernServerInterface,
} from '../type';
import { metrics as defaultMetrics } from '../libs/metrics';
import { createProdServer } from './modern-server-split';

export class Server {
  public options: ModernServerOptions;

  protected serverImpl: ServerConstructor = createProdServer;

  private server!: ModernServerInterface;

  private app!: httpServer;

  private runner!: ServerHookRunner;

  constructor(options: ModernServerOptions) {
    options.logger = options.logger || defaultLogger;
    options.metrics = options.metrics || defaultMetrics;

    this.options = options;
  }

  public async init() {
    const { options } = this;

    // initialize server runner
    this.runner = await this.createHookRunner();

    // initialize server
    this.server = this.serverImpl(options);

    // create http-server
    this.app = await this.server.createHTTPServer(this.getRequestHandler());

    // runner can only be used after server init
    await this.server.onInit(this.runner);

    return this;
  }

  public async close() {
    await this.server.onClose();
    await new Promise<void>(resolve =>
      this.app.close(() => {
        resolve();
      }),
    );
  }

  public listen(port = 8080, listener: any) {
    this.app.listen(process.env.PORT || port, () => {
      if (listener) {
        listener();
      }

      this.server.onListening(this.app);
    });
  }

  public getRequestHandler() {
    return (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
      const requestHandler = this.server.getRequestHandler();
      return requestHandler(req, res, next);
    };
  }

  private async createHookRunner() {
    // clear server manager every create time
    serverManager.clear();

    const { options } = this;
    const { pwd: appDirectory, plugins = [] } = options;

    // server app context for serve plugin
    const serverPlugins = plugins.map(p => {
      serverManager.usePlugin(compatRequire(p.pluginPath));
      return {
        server: p,
      };
    });
    const appContext = initAppContext(appDirectory, serverPlugins, '');
    serverManager.run(() => {
      ConfigContext.set(this.options.config as UserConfig);
      AppContext.set({
        ...appContext,
        distDirectory: path.join(
          options.pwd,
          options.config.output?.path || 'dist',
        ),
      });
    });

    return serverManager.init({});
  }
}
