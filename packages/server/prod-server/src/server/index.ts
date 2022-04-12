import { IncomingMessage, ServerResponse, Server as httpServer } from 'http';
import path from 'path';
import {
  serverManager,
  AppContext,
  ConfigContext,
  loadPlugins,
} from '@modern-js/server-core';
import type { ServerPlugin } from '@modern-js/server-core';
import {
  logger as defaultLogger,
  SHARED_DIR,
  OUTPUT_CONFIG_FILE,
} from '@modern-js/utils';
import type { UserConfig } from '@modern-js/core';
import { ISAppContext } from '@modern-js/types';
import mergeDeep from 'merge-deep';
import {
  ModernServerOptions,
  ServerHookRunner,
  ServerConstructor,
  ModernServerInterface,
} from '../type';
import { metrics as defaultMetrics } from '../libs/metrics';
import {
  loadConfig,
  getServerConfigPath,
  requireConfig,
} from '../libs/loadConfig';
import { debug } from '../utils';
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

    this.initConfig(options);

    // initialize server runner
    this.runner = await this.createHookRunner();

    this.runConfigHook(this.runner, options);

    // initialize server
    this.server = this.serverImpl(options);

    await this.runPrepareHook(this.runner);

    // create http-server
    this.app = await this.server.createHTTPServer(this.getRequestHandler());

    // runner can only be used after server init
    await this.server.onInit(this.runner);

    return this;
  }

  /**
   * Execute config hooks
   * @param runner
   * @param options
   */
  runConfigHook(runner: ServerHookRunner, options: ModernServerOptions) {
    const { serverConfig } = options;
    const newServerConfig = runner.config(serverConfig || {});
    options.config = mergeDeep({}, options.config, newServerConfig);
  }

  async runPrepareHook(runner: ServerHookRunner) {
    runner.prepare();
  }

  /**
   *
   * merge cliConfig and serverConfig
   */
  private initConfig(options: ModernServerOptions) {
    const { pwd, config, serverConfigFile } = options;

    const serverConfigPath = getServerConfigPath(pwd, serverConfigFile);
    const serverConfig = requireConfig(serverConfigPath);
    const resolvedConfigPath = path.join(
      pwd,
      config?.output?.path || 'dist',
      OUTPUT_CONFIG_FILE,
    );

    options.serverConfig = serverConfig;
    options.config = loadConfig({
      cliConfig: config,
      serverConfig,
      resolvedConfigPath,
    });
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
    // TODO: 确认下这里是不是可以不从 options 中取插件，而是从 config 中取和过滤
    const { plugins = [], pwd, config } = options;

    // server app context for serve plugin
    const loadedPlugins = loadPlugins(
      plugins.concat(config.plugins as ServerPlugin[]),
      pwd,
    );

    debug('plugins', config.plugins, loadedPlugins);
    loadedPlugins.forEach(p => {
      serverManager.usePlugin(p);
    });

    const appContext = this.initAppContext();
    serverManager.run(() => {
      ConfigContext.set(config as UserConfig);
      AppContext.set({
        ...appContext,
        distDirectory: path.join(pwd, config.output?.path || 'dist'),
      });
    });

    return serverManager.init({});
  }

  private initAppContext(): ISAppContext {
    const { options } = this;
    const { pwd: appDirectory, plugins = [], config } = options;
    const serverPlugins = plugins.map(p => ({
      server: p,
    }));

    return {
      appDirectory,
      distDirectory: path.join(appDirectory, config.output?.path || 'dist'),
      sharedDirectory: path.resolve(appDirectory, SHARED_DIR),
      plugins: serverPlugins,
    };
  }
}
