/* eslint-disable max-lines */
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
  ServerRoute,
} from '@modern-js/types';
import type { SSR } from '@modern-js/server-core';
import { merge as deepMerge } from '@modern-js/utils/lodash';
import { RenderHandler } from '@modern-js/prod-server/src/libs/render';
import { RsbuildDevServerOptions } from '@rsbuild/shared';
import { getDefaultDevOptions } from '../constants';
import { createMockHandler } from '../dev-tools/mock';
import { enableRegister } from '../dev-tools/register';
import Watcher, { mergeWatchOptions, WatchEvent } from '../dev-tools/watcher';
import type { DevServerOptions, ModernDevServerOptions } from '../types';
import { workerSSRRender } from './workerSSRRender';

const transformToRsbuildServerOptions = (
  dev: DevServerOptions,
): RsbuildDevServerOptions['dev'] => {
  const rsbuildOptions: RsbuildDevServerOptions['dev'] = {
    hmr: Boolean(dev.hot),
    client: dev.client,
    writeToDisk: dev.devMiddleware?.writeToDisk,
    compress: dev.compress,
    headers: dev.headers,
    historyApiFallback: dev.historyApiFallback,
    proxy: dev.proxy,
    publicDir: false,
  };
  if (dev.before?.length || dev.after?.length) {
    rsbuildOptions.setupMiddlewares = [
      ...(dev.setupMiddlewares || []),
      middlewares => {
        // the order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after.
        middlewares.unshift(...(dev.before || []));

        middlewares.push(...(dev.after || []));
      },
    ];
  } else if (dev.setupMiddlewares) {
    rsbuildOptions.setupMiddlewares = dev.setupMiddlewares;
  }

  return rsbuildOptions;
};

export class ModernDevServer extends ModernServer {
  private mockHandler: ReturnType<typeof createMockHandler> = null;

  private readonly dev: DevServerOptions;

  private readonly useWorkerSSR: boolean;

  private readonly appContext: ModernDevServerOptions['appContext'];

  private getDevMiddlewares: any;

  private watcher?: Watcher;

  private closeCb: Array<() => Promise<void>> = [];

  constructor(options: ModernDevServerOptions) {
    super(options);

    this.appContext = options.appContext;

    // dev server should work in pwd
    this.workDir = this.pwd;

    this.useWorkerSSR = Boolean(options.useWorkerSSR);

    // set dev server options, like webpack-dev-server
    this.dev = this.getDevOptions(options);

    this.getDevMiddlewares = options.getDevMiddlewares;

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

  // Complete the preparation of services
  public async onInit(runner: ServerHookRunner, app: Server) {
    this.runner = runner;
    const { dev, conf } = this;

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

    const {
      middlewares: rsbuildMiddlewares,
      close,
      devMiddlewareEvents,
    } = await this.getDevMiddlewares(app, {
      ...transformToRsbuildServerOptions(this.dev),
      compress:
        !isUseStreamingSSR(this.getRoutes()) &&
        !isUseSSRPreload() &&
        dev.compress,
      htmlFallback: false,
      publicDir: false,
    });

    devMiddlewareEvents.on('change', (stats: any) => {
      // Reset only when client compile done
      if (stats.toJson({ all: false }).name !== 'server') {
        this.onRepack({ routes: this.getRoutes() });
      }
    });

    // before dev handler
    const beforeHandlers = await this.setupBeforeDevMiddleware();
    this.addMiddlewareHandler([...beforeHandlers]);

    await this.applyDefaultMiddlewares();

    this.addMiddlewareHandler(rsbuildMiddlewares);

    this.closeCb.push(close);

    // after dev handler
    const afterHandlers = await this.setupAfterDevMiddleware();

    this.addMiddlewareHandler([...afterHandlers]);

    await super.onInit(runner, app);

    // watch mock/ server/ api/ dir file change
    if (dev.watch) {
      this.startWatcher();
      app.on('close', async () => {
        await this.watcher?.close();
      });
    }
  }

  public async close() {
    for (const cb of this.closeCb) {
      await cb();
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

  private async applyDefaultMiddlewares() {
    const { pwd } = this;

    // mock handler
    this.mockHandler = createMockHandler({ pwd });
    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      if (this.mockHandler) {
        this.mockHandler(ctx, next);
      } else {
        next();
      }
    });
  }

  public onRepack(options: BuildOptions = {}) {
    // reset the routing management instance every times the service starts
    if (Array.isArray(options.routes)) {
      this.router.reset(this.filterRoutes(options.routes));
    }

    // clean ssr bundle cache
    this.cleanSSRCache();

    // reset static file
    this.reader.updateFile();

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

  protected initReader() {
    let isInit = false;
    // TODO: this.devMiddleware ?
    if (this.dev?.devMiddleware?.writeToDisk === false) {
      this.addHandler((ctx, next) => {
        if (isInit) {
          return next();
        }
        isInit = true;

        if (!ctx.res.locals!.webpack) {
          this.reader.init();
          return next();
        }

        const { devMiddleware: webpackDevMid } = ctx.res.locals!.webpack;
        const { outputFileSystem } = webpackDevMid;
        if (outputFileSystem) {
          this.reader.init(outputFileSystem);
        } else {
          this.reader.init();
        }
        return next();
      });
    } else {
      super.initReader();
    }
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
    return async (_context: ModernServerContext, next: NextFunction) => {
      return next();
    };
  }

  private async setupBeforeDevMiddleware() {
    const { runner, conf } = this;

    const pluginMids = await runner.beforeDevServer(conf);

    return [...pluginMids].flat();
  }

  private async setupAfterDevMiddleware() {
    const { runner, conf } = this;
    const pluginMids = await runner.afterDevServer(conf);

    return [...pluginMids].flat();
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
