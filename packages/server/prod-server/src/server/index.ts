import { IncomingMessage, ServerResponse, Server as httpServer } from 'http';
import type { ListenOptions } from 'net';
import path from 'path';
import fs from 'fs';
import {
  Logger,
  SHARED_DIR,
  OUTPUT_CONFIG_FILE,
  LoggerInterface,
  dotenv,
  dotenvExpand,
} from '@modern-js/utils';
import {
  serverManager,
  AppContext,
  ConfigContext,
  loadPlugins,
  ServerConfig,
} from '@modern-js/server-core';
import type { UserConfig } from '@modern-js/core';
import { ISAppContext } from '@modern-js/types';
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

  private serverConfig: ServerConfig;

  constructor(options: ModernServerOptions) {
    options.logger =
      options.logger ||
      (new Logger({
        level: 'warn',
      }) as Logger & LoggerInterface);
    options.metrics = options.metrics || defaultMetrics;

    this.options = options;
    this.serverConfig = {};
  }

  /**
   * 初始化顺序
   * - 读取 .env.{process.env.MODERN_ENV} 文件，加载环境变量
   * - 获取 server runtime config
   * - 设置 context
   * - 创建 hooksRunner
   * - 合并插件，内置插件和 serverConfig 中配置的插件
   * - 执行 config hook
   * - 获取最终的配置
   * - 设置配置到 context
   * - 初始化 server
   * - 执行 prepare hook
   * - 执行 server init
   */
  public async init() {
    const { options } = this;

    this.loadServerEnv(options);

    this.initServerConfig(options);

    await this.injectContext(this.runner, options);

    // initialize server runner
    this.runner = await this.createHookRunner();

    // init config and execute config hook
    await this.initConfig(this.runner, options);

    await this.injectContext(this.runner, options);

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
  private runConfigHook(runner: ServerHookRunner, serverConfig: ServerConfig) {
    const newServerConfig = runner.config(serverConfig || {});
    return newServerConfig;
  }

  private async runPrepareHook(runner: ServerHookRunner) {
    runner.prepare();
  }

  private initServerConfig(options: ModernServerOptions) {
    const { pwd, serverConfigFile } = options;
    const distDirectory = path.join(pwd, options.config.output?.path || 'dist');
    const serverConfigPath = getServerConfigPath(
      distDirectory,
      serverConfigFile,
    );
    const serverConfig = requireConfig(serverConfigPath);
    this.serverConfig = serverConfig;
  }

  /**
   *
   * merge cliConfig and serverConfig
   */
  private async initConfig(
    runner: ServerHookRunner,
    options: ModernServerOptions,
  ) {
    const { pwd, config } = options;

    const { serverConfig } = this;

    const finalServerConfig = this.runConfigHook(runner, serverConfig);

    const resolvedConfigPath = path.join(
      pwd,
      config?.output?.path || 'dist',
      OUTPUT_CONFIG_FILE,
    );

    options.config = loadConfig({
      cliConfig: config,
      serverConfig: finalServerConfig,
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

  public listen<T extends number | ListenOptions | undefined>(
    options: T,
    listener: any,
  ) {
    const callback = () => {
      if (listener) {
        listener();
      }

      this.server.onListening(this.app);
    };

    if (typeof options === 'object') {
      this.app.listen(options, callback);
    } else {
      this.app.listen(process.env.PORT || options || 8080, callback);
    }
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

    const serverPlugins = this.serverConfig.plugins || [];

    // server app context for serve plugin
    const loadedPlugins = loadPlugins(plugins.concat(serverPlugins), pwd);

    debug('plugins', config.plugins, loadedPlugins);
    loadedPlugins.forEach(p => {
      serverManager.usePlugin(p);
    });

    // create runner
    const hooksRunner = await serverManager.init();

    return hooksRunner;
  }

  private async injectContext(
    runner: ServerHookRunner,
    options: ModernServerOptions,
  ) {
    const appContext = this.initAppContext();
    const { config, pwd } = options;

    ConfigContext.set(config as UserConfig);
    AppContext.set({
      ...appContext,
      distDirectory: path.join(pwd, config.output?.path || 'dist'),
    });
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

  private loadServerEnv(options: ModernServerOptions) {
    const { pwd: appDirectory } = options;
    const serverEnv = process.env.MODERN_ENV;
    const serverEnvPath = path.resolve(appDirectory, `.env.${serverEnv}`);
    if (
      serverEnv &&
      fs.existsSync(serverEnvPath) &&
      !fs.statSync(serverEnvPath).isDirectory()
    ) {
      const envConfig = dotenv.config({ path: serverEnvPath });
      dotenvExpand(envConfig);
    }
  }
}
