import { INTERNAL_SERVER_PLUGINS } from '@modern-js/utils/universal/constants';
import { ISAppContext } from '@modern-js/types';
import { Hono } from 'hono';
import type * as modernUtilsModule from '@modern-js/utils';
import type * as loadPluginModule from '../core/loadPlugins';
import {
  AppContext,
  ConfigContext,
  ServerConfig,
  ServerHookRunner,
  serverManager,
  createPlugin,
} from '../core';
import type { HonoEnv, ServerBaseOptions } from '../core/server';
import type * as serverConfigModule from './utils/serverConfig';
import { getRuntimeEnv } from './utils';

declare module '@modern-js/types' {
  interface ISAppContext {
    serverBase?: ServerBase;
  }
}

export class ServerBase<E extends HonoEnv = any> {
  public options: ServerBaseOptions;

  public runner!: ServerHookRunner;

  private app: Hono<E>;

  private serverConfig: ServerConfig = {};

  constructor(options: ServerBaseOptions) {
    this.options = options;

    this.app = new Hono<E>();
  }

  /**
   * 初始化顺序
   * - 获取 server runtime config
   * - 设置 context
   * - 创建 hooksRunner
   * - 合并插件，内置插件和 serverConfig 中配置的插件
   * - 执行 config hook
   * - 获取最终的配置
   * - 设置配置到 context
   * - 执行 prepare hook
   */
  async init() {
    const { options } = this;

    const runtimeEnv = getRuntimeEnv();

    // TODO: support  in other js runtime
    runtimeEnv === 'node' && (await this.initServerConfig(options));

    await this.injectContext(options);

    // initialize server runner
    this.runner = await this.createHookRunner();

    // init config and execute config hook
    // TODO: only load serverConfig in other js runtime
    runtimeEnv === 'node' && (await this.initConfig(this.runner, options));

    // FIXME: injectContext fn not need call twice.
    await this.injectContext(options);

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await this.runner.prepare();

    return this;
  }

  private async createHookRunner() {
    // clear server manager every create time
    serverManager.clear();

    const runtimeEnv = getRuntimeEnv();

    // TODO: support loadPlugins in other js runtime
    const internalPlugins =
      runtimeEnv === 'node' ? await this.loadInternalPlugins() : [];
    const externalPlugins = this.loadExternalPlugins();
    const loadedPlugins = [...internalPlugins, ...externalPlugins];

    // TODO: support import('debug').browser
    // debug('plugins', loadedPlugins);
    loadedPlugins.forEach(p => {
      serverManager.usePlugin(p);
    });

    // create runner
    const hooksRunner = await serverManager.init();

    return hooksRunner;
  }

  private async loadInternalPlugins() {
    const {
      internalPlugins: plugins = INTERNAL_SERVER_PLUGINS,
      appContext,
      pwd,
    } = this.options;

    const loadPluginsModule = '../core/loadPlugins';
    const { loadPlugins } = (await import(
      loadPluginsModule
    )) as typeof loadPluginModule;
    const internalPlugins = loadPlugins(
      appContext.appDirectory || pwd,
      plugins,
    );

    return internalPlugins;
  }

  private loadExternalPlugins() {
    const { plugins = [] } = this.options;
    const configPlugins = this.serverConfig.plugins || [];

    const externalPlugins = [...plugins, ...configPlugins];

    return externalPlugins.map(plugin => createPlugin(plugin.setup, plugin));
  }

  private async initServerConfig(options: ServerBaseOptions) {
    const { pwd, serverConfigFile } = options;

    const utilsModuleName = './utils/serverConfig';
    const { getServerConfigPath, requireConfig } = (await import(
      utilsModuleName
    )) as typeof serverConfigModule;

    const serverConfigPath = await getServerConfigPath(pwd, serverConfigFile);

    const serverConfig = requireConfig(serverConfigPath);
    this.serverConfig = serverConfig;
  }

  private async injectContext(options: ServerBaseOptions) {
    const appContext = await this.initAppContext();
    const { config, pwd } = options;

    ConfigContext.set(config);
    AppContext.set({
      ...appContext,
      serverBase: this,
      distDirectory: pwd,
    });
  }

  private async initAppContext(): Promise<ISAppContext> {
    const { options } = this;
    const { pwd, plugins = [], appContext } = options;
    const serverPlugins = plugins.map(p => ({
      server: p,
    }));

    return {
      appDirectory: appContext?.appDirectory || '',
      apiDirectory: appContext?.apiDirectory,
      lambdaDirectory: appContext?.lambdaDirectory,
      sharedDirectory: appContext.sharedDirectory || '',
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
    // Only support node.js
    const path = await import('path').catch(_ => {
      return {} as any;
    });

    // TODO: need to confirm.
    const utilsModuleName = '@modern-js/utils';
    const { ensureAbsolutePath, OUTPUT_CONFIG_FILE } = (await import(
      utilsModuleName
    )) as typeof modernUtilsModule;

    const configModuleName = './utils/serverConfig';
    const { loadConfig } = (await import(
      configModuleName
    )) as typeof serverConfigModule;
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
    return this.app.all.bind(this);
  }

  get use() {
    return this.app.use.bind(this);
  }

  get get() {
    return this.app.get.bind(this);
  }

  get post() {
    return this.app.post.bind(this);
  }

  get put() {
    return this.app.put.bind(this);
  }

  get delete() {
    return this.app.delete.bind(this);
  }

  get patch() {
    return this.app.patch.bind(this);
  }

  get handle() {
    return this.app.fetch.bind(this);
  }

  get request() {
    return this.app.request.bind(this);
  }

  get notFound() {
    return this.app.notFound.bind(this);
  }

  get onError() {
    return this.app.onError.bind(this);
  }
}

export function createServerBase<E extends HonoEnv>(
  options: ServerBaseOptions,
) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new ServerBase<E>(options);

  return server;
}
