import type { Plugin } from '@modern-js/plugin-v2';
import { type ServerCreateOptions, server } from '@modern-js/plugin-v2/server';
import { Hono, type MiddlewareHandler } from 'hono';
import { run } from './context';
import { handleSetupResult } from './plugins/compat/hooks';

import type {
  Env,
  ServerConfig,
  ServerContext,
  ServerPlugin,
  ServerPluginHooks,
  ServerPluginLegacy,
} from './types';
import type { CliConfig } from './types/config';
import { loadConfig } from './utils';

declare module '@modern-js/types' {
  interface ISAppContext {
    serverBase?: ServerBase;
  }
}

export interface ServerBaseOptions extends ServerCreateOptions {
  /** server working directory, and then also dist directory */
  config: CliConfig;
  serverConfig?: ServerConfig;
  runMode?: 'apiOnly' | 'ssrOnly' | 'webOnly';
}

export class ServerBase<E extends Env = any> {
  public options: ServerBaseOptions;

  private app: Hono<E>;

  private plugins: (ServerPlugin | ServerPluginLegacy)[] = [];

  private serverContext: ServerContext | null = null;

  constructor(options: ServerBaseOptions) {
    this.options = options;

    this.app = new Hono<E>();
    this.app.use('*', run);
  }

  /**
   * Order
   * - server runner
   * - apply middlewares
   */
  async init() {
    const { serverConfig, config: cliConfig } = this.options;
    const mergedConfig = loadConfig({
      cliConfig,
      serverConfig: serverConfig || {},
    });

    const { serverContext } = await server.run({
      plugins: this.plugins as Plugin[],
      options: this.options,
      config: mergedConfig,
      handleSetupResult,
    });
    serverContext.serverBase = this;
    this.serverContext = serverContext as unknown as ServerContext;
    // need after serverContext to run onPrepare
    await serverContext.hooks.onPrepare.call();
    this.#applyMiddlewares();

    return this;
  }

  addPlugins(plugins: (ServerPlugin | ServerPluginLegacy)[]) {
    this.plugins.push(...plugins);
  }

  #applyMiddlewares() {
    const { middlewares } = this.serverContext!;

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

  get hooks() {
    return this.serverContext!.hooks as ServerPluginHooks;
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
