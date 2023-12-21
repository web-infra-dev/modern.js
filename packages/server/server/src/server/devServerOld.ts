import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import path from 'path';
import { createServer as createHttpsServer } from 'https';
import {
  API_DIR,
  SERVER_BUNDLE_DIRECTORY,
  SERVER_DIR,
  SHARED_DIR,
  LOADABLE_STATS_FILE,
} from '@modern-js/utils';
import {
  createProxyHandler,
  NextFunction,
  ServerHookRunner,
  ModernServer,
  AGGRED_DIR,
  BuildOptions,
  createRenderHandler,
} from '@modern-js/prod-server';
import type {
  ModernServerContext,
  RequestHandler,
  ExposeServerApis,
  ServerRoute,
} from '@modern-js/types';
import type { SSR } from '@modern-js/server-core';
import { merge as deepMerge } from '@modern-js/utils/lodash';
import { RenderHandler } from '@modern-js/prod-server/src/libs/render';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { getDefaultDevOptions } from '../constants';
import { createMockHandler } from '../dev-tools/mock';
import { enableRegister } from '../dev-tools/register';
import Watcher, { mergeWatchOptions, WatchEvent } from '../dev-tools/watcher';
import type { DevServerOptions, ModernDevServerOptions } from '../types';
import DevMiddleware from '../dev-tools/dev-middleware';
import { workerSSRRender } from './workerSSRRender';

export class ModernDevServer extends ModernServer {
  private mockHandler: ReturnType<typeof createMockHandler> = null;

  private readonly dev: DevServerOptions;

  private readonly useWorkerSSR: boolean;

  private readonly appContext: ModernDevServerOptions['appContext'];

  private readonly devMiddleware: DevMiddleware;

  private watcher?: Watcher;

  constructor(options: ModernDevServerOptions) {
    super(options);

    this.appContext = options.appContext;

    // dev server should work in pwd
    this.workDir = this.pwd;

    this.useWorkerSSR = Boolean(options.useWorkerSSR);

    // set dev server options, like webpack-dev-server
    this.dev = this.getDevOptions(options);

    // create dev middleware instance
    this.devMiddleware = new DevMiddleware({
      dev: this.dev,
      devMiddleware: options.devMiddleware,
    });

    enableRegister(this.pwd, this.conf);
  }

  private getDevOptions(options: ModernDevServerOptions) {
    const devOptions = typeof options.dev === 'boolean' ? {} : options.dev;
    const defaultOptions = getDefaultDevOptions();
    return deepMerge(defaultOptions, devOptions);
  }

  private addMiddlewareHandler(handlers: RequestHandler[]) {
    handlers.forEach(handler => {
      this.addHandler((ctx, next) => {
        const { req, res } = ctx;
        return handler(req, res, next);
      });
    });
  }

  private applySetupMiddlewares() {
    const setupMiddlewares = this.dev.setupMiddlewares || [];

    const serverOptions: ExposeServerApis = {
      sockWrite: (type, data) => this.devMiddleware.sockWrite(type, data),
    };

    const befores: RequestHandler[] = [];
    const afters: RequestHandler[] = [];

    setupMiddlewares.forEach(handler => {
      handler(
        {
          unshift: (...handlers) => befores.unshift(...handlers),
          push: (...handlers) => afters.push(...handlers),
        },
        serverOptions,
      );
    });

    return { befores, afters };
  }

  // Complete the preparation of services
  public async onInit(runner: ServerHookRunner, app: Server) {
    this.runner = runner;

    const { dev } = this;

    // Order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after
    const { befores, afters } = this.applySetupMiddlewares();

    // before dev handler
    const beforeHandlers = this.dev.before || [];
    this.addMiddlewareHandler([...beforeHandlers, ...befores]);

    await this.applyDefaultMiddlewares(app);

    // after dev handler
    const afterHandlers = this.dev.after || [];

    this.addMiddlewareHandler([...afters, ...afterHandlers]);

    this.initFileReader();
    await super.onInit(runner, app);

    // watch mock/ server/ api/ dir file change
    if (dev.watch) {
      this.startWatcher();
      app.on('close', async () => {
        await this.watcher?.close();
      });
    }
  }

  // override the ModernServer renderHandler logic
  public getRenderHandler(): RenderHandler {
    if (this.useWorkerSSR) {
      const { distDir, staticGenerate, conf, metaName } = this;
      const ssrConfig = this.conf.server?.ssr;
      const forceCSR =
        typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;

      // if we use worker ssr, we need override the routeRenderHandler
      return createRenderHandler({
        ssrRender: workerSSRRender,
        distDir,
        staticGenerate,
        conf,
        forceCSR,
        nonce: conf.security?.nonce,
        metaName,
      });
    }
    return super.getRenderHandler();
  }

  private initFileReader() {
    let isInit = false;

    if (this.dev?.devMiddleware?.writeToDisk === false) {
      this.addHandler((ctx, next) => {
        if (isInit) {
          return next();
        }
        isInit = true;

        if (!ctx.res.locals?.webpack) {
          fileReader.reset();
          return next();
        }

        const { devMiddleware: webpackDevMid } = ctx.res.locals.webpack;
        const { outputFileSystem } = webpackDevMid;
        if (outputFileSystem) {
          fileReader.reset(outputFileSystem);
        } else {
          fileReader.reset();
        }
        return next();
      });
    }
  }

  private async applyDefaultMiddlewares(app: Server) {
    const { pwd, dev, devMiddleware, conf } = this;

    // the http-compression can't handler stream http.
    // so we disable compress when user use stream ssr temporarily.
    const isUseStreamingSSR = (routes?: ServerRoute[]) =>
      routes?.some(r => r.isStream === true);

    const isUseSSRPreload = () => {
      const {
        server: { ssr, ssrByEntries },
      } = conf;

      const checkUsePreload = (ssr?: SSR) =>
        typeof ssr === 'object' && Boolean(ssr.preload);

      return (
        checkUsePreload(ssr) ||
        Object.values(ssrByEntries || {}).some(ssr => checkUsePreload(ssr))
      );
    };

    // compression should be the first middleware
    if (
      !isUseStreamingSSR(this.getRoutes()) &&
      !isUseSSRPreload() &&
      dev.compress
    ) {
      // @ts-expect-error http-compression does not provide a type definition
      const { default: compression } = await import('http-compression');
      this.addHandler((ctx, next) => {
        compression({
          gzip: true,
          brotli: false,
        })(ctx.req, ctx.res, next);
      });
    }

    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      // allow hmr request cross-domain, because the user may use global proxy
      ctx.res.setHeader('Access-Control-Allow-Origin', '*');
      if (ctx.path.includes('hot-update')) {
        ctx.res.setHeader('Access-Control-Allow-Credentials', 'false');
      }

      // 用户在 devServer 上配置的 headers 不会对 html 的请求生效，加入下面代码，使配置的 headers 对所有请求生效
      const confHeaders = dev.headers;
      if (confHeaders) {
        for (const [key, value] of Object.entries(confHeaders)) {
          ctx.res.setHeader(key, value);
        }
      }
      next();
    });

    // mock handler
    this.mockHandler = createMockHandler({ pwd });
    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      if (this.mockHandler) {
        this.mockHandler(ctx, next);
      } else {
        next();
      }
    });

    // dev proxy handler, each proxy has own handler
    if (dev.proxy) {
      const { handlers, handleUpgrade } = createProxyHandler(dev.proxy);
      app && handleUpgrade(app);
      handlers.forEach(handler => {
        this.addHandler(handler);
      });
    }

    // do webpack build / plugin apply / socket server when pass compiler instance
    devMiddleware.init(app);
    devMiddleware.on('change', (stats: any) => {
      // Reset only when client compile done
      if (stats.toJson({ all: false }).name !== 'server') {
        this.onRepack({ routes: this.getRoutes() });
      }
    });
    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      const { req, res } = ctx;
      if (devMiddleware.middleware) {
        devMiddleware.middleware(req, res, next);
      } else {
        next();
      }
    });

    if (dev.historyApiFallback) {
      const { default: connectHistoryApiFallback } = await import(
        'connect-history-api-fallback'
      );

      const historyApiFallbackMiddleware = connectHistoryApiFallback(
        typeof dev.historyApiFallback === 'boolean'
          ? {}
          : dev.historyApiFallback,
      ) as RequestHandler;
      this.addHandler((ctx, next) =>
        historyApiFallbackMiddleware(ctx.req, ctx.res, next),
      );
    }
  }

  public onRepack(options: BuildOptions = {}) {
    // reset the routing management instance every times the service starts
    if (Array.isArray(options.routes)) {
      this.router.reset(this.filterRoutes(options.routes));
    }

    // clean ssr bundle cache
    this.cleanSSRCache();

    // reset static file
    fileReader.reset();

    this.runner.repack();

    super.onRepack(options);
  }

  public async createHTTPServer(
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next?: () => void,
    ) => void,
  ) {
    const { dev } = this;
    const devHttpsOption = typeof dev === 'object' && dev.https;
    if (devHttpsOption) {
      const { genHttpsOptions } = require('../dev-tools/https');
      const httpsOptions = await genHttpsOptions(devHttpsOption, this.pwd);
      return createHttpsServer(httpsOptions, handler);
    } else {
      return createServer(handler);
    }
  }

  protected warmupSSRBundle() {
    // not warmup ssr bundle on development
  }

  protected async onServerChange({
    filepath,
    event,
  }: {
    filepath: string;
    event: WatchEvent;
  }) {
    const { pwd } = this;
    const { mock } = AGGRED_DIR;
    const mockPath = path.normalize(path.join(pwd, mock));

    this.runner.reset();

    if (filepath.startsWith(mockPath)) {
      this.mockHandler = createMockHandler({ pwd });
    } else {
      try {
        const success = this.runner.onApiChange([
          { filename: filepath, event },
        ]);

        // onApiChange 钩子被调用，且返回 true，则表示无需重新编译
        // onApiChange 的类型是 WaterFall,WaterFall 钩子的返回值类型目前有问题

        // @ts-expect-error
        if (success !== true) {
          await super.onServerChange({ filepath });
        }
      } catch (e) {
        this.logger.error(e as Error);
      }
    }
  }

  protected createContext(req: IncomingMessage, res: ServerResponse) {
    return super.createContext(req, res, {
      etag: true,
      metaName: this.metaName,
    });
  }

  protected setupStaticMiddleware(_: string) {
    // dev-server-middleware hosting all assets in the development env
    return async (context: ModernServerContext, next: NextFunction) => {
      return next();
    };
  }

  private cleanSSRCache() {
    const { distDir } = this;
    const bundles = this.router.getBundles();

    bundles.forEach(bundle => {
      const filepath = path.join(distDir, bundle as string);
      if (require.cache[filepath]) {
        delete require.cache[filepath];
      }
    });

    const loadable = path.join(distDir, LOADABLE_STATS_FILE);
    if (require.cache[loadable]) {
      delete require.cache[loadable];
    }
  }

  private startWatcher() {
    const { pwd, distDir, appContext } = this;
    const { mock } = AGGRED_DIR;
    const apiDir = appContext?.apiDirectory || API_DIR;
    const sharedDir = appContext?.sharedDirectory || SHARED_DIR;
    const defaultWatched = [
      `${mock}/**/*`,
      `${SERVER_DIR}/**/*`,
      `${apiDir}/**`,
      `${sharedDir}/**/*`,
      `${distDir}/${SERVER_BUNDLE_DIRECTORY}/*-server-loaders.js`,
    ];

    const watchOptions = mergeWatchOptions(this.conf.server?.watchOptions);

    const defaultWatchedPaths = defaultWatched.map(p => {
      const finalPath = path.isAbsolute(p) ? p : path.join(pwd, p);
      return path.normalize(finalPath);
    });

    const watcher = new Watcher();
    watcher.createDepTree();

    // 监听文件变动，如果有变动则给 client，也就是 start 启动的插件发消息
    watcher.listen(defaultWatchedPaths, watchOptions, (filepath, event) => {
      // Todo should delte this cache in onRepack
      if (filepath.includes('-server-loaders.js')) {
        delete require.cache[filepath];
        return;
      } else {
        watcher.updateDepTree();
        watcher.cleanDepCache(filepath);
      }

      this.onServerChange({
        filepath,
        event,
      });
    });

    this.watcher = watcher;
  }
}
