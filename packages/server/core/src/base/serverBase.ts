import path from 'node:path';
import {
  INTERNAL_SERVER_PLUGINS,
  OUTPUT_CONFIG_FILE,
  SHARED_DIR,
  ensureAbsolutePath,
} from '@modern-js/utils';
import { ISAppContext } from '@modern-js/types';
import { ServerOptions } from '@config/index';
import { Hono } from 'hono';
import {
  AppContext,
  ConfigContext,
  ServerConfig,
  ServerHookRunner,
  loadPlugins,
  serverManager,
} from '../core';
import { HonoEnv, ServerBaseOptions } from './types';
import { debug } from './utils';
import {
  getServerConfigPath,
  loadConfig,
  requireConfig,
} from './libs/loadConfig';

declare module '@modern-js/types' {
  interface ISAppContext {
    serverBase?: ServerBase;
  }
}

export class ServerBase<E extends HonoEnv = any> {
  public options: ServerBaseOptions;

  public runner!: ServerHookRunner;

  private workDir: string;

  private distDir: string;

  private app: Hono<E>;

  private serverConfig: ServerConfig = {};

  private conf: ServerOptions;

  constructor(options: ServerBaseOptions) {
    this.options = options;

    this.app = new Hono<E>();
    this.serverConfig = {};
    const { pwd, config } = options;
    this.distDir = path.resolve(pwd, config.output.path || 'dist');
    this.workDir = this.distDir;
    this.conf = config;
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
  async init(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { disableHttpServer = false }: { disableHttpServer?: boolean } = {
      disableHttpServer: false,
    },
  ) {
    const { options } = this;

    this.initServerConfig(options);

    await this.injectContext(options);

    // initialize server runner
    this.runner = await this.createHookRunner();

    // init config and execute config hook
    await this.initConfig(this.runner, options);

    // FIXME: injectContext fn not need call twice.
    await this.injectContext(options);

    await this.runner.prepare();

    return this;
  }

  private async createHookRunner() {
    // clear server manager every create time
    serverManager.clear();

    const { options } = this;
    // TODO: 确认下这里是不是可以不从 options 中取插件，而是从 config 中取和过滤
    const {
      internalPlugins = INTERNAL_SERVER_PLUGINS,
      pwd,
      plugins = [],
    } = options;
    const serverPlugins = this.serverConfig.plugins || [];
    // server app context for serve plugin
    const loadedPlugins = loadPlugins(
      options.appContext.appDirectory || pwd,
      [...serverPlugins, ...plugins],
      {
        internalPlugins,
      },
    );

    debug('plugins', loadedPlugins);
    loadedPlugins.forEach(p => {
      serverManager.usePlugin(p);
    });

    // create runner
    const hooksRunner = await serverManager.init();

    return hooksRunner;
  }

  private initServerConfig(options: ServerBaseOptions) {
    const { pwd, serverConfigFile } = options;
    const distDirectory = [pwd, options.config.output.path || 'dist'].join('/');
    const serverConfigPath = getServerConfigPath(
      distDirectory,
      serverConfigFile,
    );
    const serverConfig = requireConfig(serverConfigPath);
    this.serverConfig = serverConfig;
  }

  private async injectContext(options: ServerBaseOptions) {
    const appContext = this.initAppContext();
    const { config, pwd } = options;

    ConfigContext.set(config);
    AppContext.set({
      ...appContext,
      serverBase: this,
      distDirectory: pwd,
    });
  }

  private initAppContext(): ISAppContext {
    const { options } = this;
    const { pwd, plugins = [], appContext } = options;
    const serverPlugins = plugins.map(p => ({
      server: p,
    }));

    return {
      appDirectory: appContext?.appDirectory || '',
      apiDirectory: appContext?.apiDirectory,
      lambdaDirectory: appContext?.lambdaDirectory,
      sharedDirectory:
        appContext?.sharedDirectory ||
        path.resolve(appContext.appDirectory || '', SHARED_DIR),
      distDirectory: pwd,
      plugins: serverPlugins,
    };
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

  private async initConfig(
    runner: ServerHookRunner,
    options: ServerBaseOptions,
  ) {
    const { pwd, config } = options;

    const { serverConfig } = this;

    const finalServerConfig = this.runConfigHook(runner, serverConfig);

    const resolvedConfigPath = ensureAbsolutePath(
      pwd,
      path.join(config.output.path || 'dist', OUTPUT_CONFIG_FILE),
    );

    options.config = loadConfig({
      cliConfig: config,
      serverConfig: finalServerConfig,
      resolvedConfigPath,
    });
  }

  get all() {
    return this.app.all;
  }

  get use() {
    return this.app.use;
  }

  get get() {
    return this.app.get;
  }

  get post() {
    return this.app.post;
  }

  get put() {
    return this.app.put;
  }

  get delete() {
    return this.app.delete;
  }

  get patch() {
    return this.app.patch;
  }

  get handle() {
    return this.app.fetch;
  }

  get request() {
    return this.app.request;
  }

  get notFound() {
    return this.app.notFound;
  }

  get onError() {
    return this.app.onError;
  }
}
