import { createContext } from '@modern-js/plugin';
import type { ISAppContext, ServerRoute } from '@modern-js/types';
import { Hono } from 'hono';
import { PluginManager } from './pluginManager';
import type {
  AppContext,
  Env,
  Middleware as MiddlewareHandler,
  ServerConfig,
  ServerHookRunner,
  ServerPlugin,
} from './types';
import type { CliConfig } from './types/config';

declare module '@modern-js/types' {
  interface ISAppContext {
    serverBase?: ServerBase;
  }
}

export type ServerBaseOptions = {
  /** server working directory, and then also dist directory */
  pwd: string;
  config: CliConfig;
  serverConfig?: ServerConfig;
  metaName?: string;
  routes?: ServerRoute[];
  appContext: {
    internalDirectory?: string;
    appDirectory?: string;
    sharedDirectory?: string;
    apiDirectory?: string;
    lambdaDirectory?: string;
    indepBffPrefix?: string;
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

    const { config, serverConfig } = options;
    const appContext = this.#getAppContext();

    this.appContext = appContext;

    this.pluginManager = new PluginManager({
      cliConfig: config,
      appContext,
      serverConfig,
    });

    this.app = new Hono<E>();
  }

  /**
   * 初始化顺序
   * - 初始化 pluginManager;
   * - 执行 runner.prepare;
   * - 应用 middlewares
   */
  async init() {
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
      internalDirectory: context?.internalDirectory || '',
      lambdaDirectory: context?.lambdaDirectory,
      sharedDirectory: context?.sharedDirectory || '',
      indepBffPrefix: context?.indepBffPrefix || '',
      distDirectory: pwd,
      plugins: [],
      metaName: metaName || 'modern-js',
      serverBase: this,
    } as any;

    return createContext<ISAppContext>(appContext);
  }

  #applyMiddlewares() {
    const { middlewares } = this.appContext.get();

    const preMiddlewares: typeof middlewares = [];
    const defaultMiddlewares: typeof middlewares = [];
    const postMiddlewares: typeof middlewares = [];

    for (const middleware of middlewares) {
      switch (middleware.order) {
        case 'pre':
          preMiddlewares.push(middleware);
          break;
        case 'post':
          postMiddlewares.push(middleware);
          break;
        default:
          defaultMiddlewares.push(middleware);
      }
    }

    const finalMiddlewares: typeof middlewares = [];

    const insertMiddleware = (middleware: (typeof middlewares)[0]) => {
      if (middleware.before) {
        const targetIndex = finalMiddlewares.findIndex(item => {
          if (middleware.before?.includes(item.name)) {
            return true;
          } else {
            return false;
          }
        });
        if (targetIndex !== -1) {
          finalMiddlewares.splice(targetIndex, 0, middleware);
        } else {
          finalMiddlewares.push(middleware);
        }
      } else {
        finalMiddlewares.push(middleware);
      }
    };

    preMiddlewares.forEach(insertMiddleware);

    defaultMiddlewares.forEach(insertMiddleware);

    postMiddlewares.forEach(insertMiddleware);

    for (const middleware of finalMiddlewares) {
      const { path = '*', method = 'all', handler } = middleware;
      const handlers = handler2Handlers(handler);

      this.app[method](path, ...handlers);
    }

    function handler2Handlers(
      handler: MiddlewareHandler[] | MiddlewareHandler,
    ): MiddlewareHandler[] {
      if (Array.isArray(handler)) {
        return handler;
      } else {
        return [handler];
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
