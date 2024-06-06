import type { Server as NodeServer } from 'http';
import { ISAppContext, ServerRoute } from '@modern-js/types';
import { Hono } from 'hono';
import { createContext } from '@modern-js/plugin';
import type { AppContext, Env, ServerHookRunner, ServerPlugin } from './types';
import type { CliConfig } from './types/config';
import { PluginManager } from './pluginManager';

declare module '@modern-js/types' {
  interface ISAppContext {
    serverBase?: ServerBase;
  }
}

export type ServerBaseOptions = {
  /** server working directory, and then also dist directory */
  pwd: string;
  config: CliConfig;
  serverConfigFile?: string;
  metaName?: string;
  routes?: ServerRoute[];
  plugins?: ServerPlugin[];
  // internalPlugins?: InternalPlugins;
  appContext: {
    appDirectory?: string;
    sharedDirectory?: string;
    apiDirectory?: string;
    lambdaDirectory?: string;
  };
  runMode?: 'apiOnly' | 'ssrOnly' | 'webOnly';
};

export class ServerBase<E extends Env = any> {
  public options: ServerBaseOptions;

  public runner!: ServerHookRunner;

  private app: Hono<E>;

  private appContext: AppContext;

  private pluginManager: PluginManager;

  constructor(options: ServerBaseOptions) {
    this.options = options;

    const { config, plugins } = options;
    const appContext = this.#getAppContext();

    this.appContext = appContext;

    this.pluginManager = new PluginManager({
      cliConfig: config,
      plugins,
      appContext,
    });

    this.app = new Hono<E>();
  }

  /**
   * 初始化顺序
   * - 初始化 pluginManager;
   * - 执行 runner.prepare;
   * - 应用 middlewares
   */
  async init({ nodeServer }: { nodeServer?: NodeServer } = {}) {
    // TODO: remove nodeServer set to appContext
    this.appContext.set({
      ...this.appContext.get(),
      nodeServer,
    });
    const runner = await this.pluginManager.init();

    this.runner = runner;

    await runner.prepare();

    this.#applyMiddlewares();

    return this;
  }

  addPlugins(plugins: ServerPlugin[]) {
    this.pluginManager.addPlugins(plugins);
  }

  #getAppContext(): AppContext {
    const { appContext: context, pwd, routes, metaName } = this.options;

    const appContext = {
      routes,
      middlewares: [],
      appDirectory: context?.appDirectory || '',
      apiDirectory: context?.apiDirectory,
      lambdaDirectory: context?.lambdaDirectory,
      sharedDirectory: context?.sharedDirectory || '',
      distDirectory: pwd,
      plugins: [],
      metaName: metaName || 'modern-js',
      serverBase: this,
    };

    return createContext<ISAppContext>(appContext);
  }

  #applyMiddlewares() {
    const { middlewares } = this.appContext.get();

    for (const middleware of middlewares) {
      const { path, method = 'all', handler } = middleware;

      if (path) {
        if (Array.isArray(handler)) {
          this.app[method](path, ...handler);
        } else {
          this.app[method](path, handler);
        }
      } else if (Array.isArray(handler)) {
        this.app[method]('*', ...handler);
      } else {
        this.app[method]('*', handler);
      }
    }
  }

  get all() {
    return this.app.all.bind(this.app);
  }

  get use() {
    return this.app.use.bind(this.app);
  }

  get get() {
    return this.app.get.bind(this.app);
  }

  get post() {
    return this.app.post.bind(this.app);
  }

  get put() {
    return this.app.put.bind(this.app);
  }

  get delete() {
    return this.app.delete.bind(this.app);
  }

  get patch() {
    return this.app.patch.bind(this.app);
  }

  get handle() {
    return this.app.fetch.bind(this.app);
  }

  get request() {
    return this.app.request.bind(this.app);
  }

  get notFound() {
    return this.app.notFound.bind(this.app);
  }

  get onError() {
    return this.app.onError.bind(this.app);
  }
}

export function createServerBase<E extends Env>(options: ServerBaseOptions) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new ServerBase<E>(options);

  return server;
}
