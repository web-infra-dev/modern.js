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
import type { ModernServerContext } from '@modern-js/types';
import { merge as deepMerge } from '@modern-js/utils/lodash';
import { RenderHandler } from '@modern-js/prod-server/src/libs/render';
import type { RsbuildInstance } from '@rsbuild/shared';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { getDefaultDevOptions } from '../constants';
import { createMockHandler } from '../dev-tools/mock';
import Watcher, { mergeWatchOptions, WatchEvent } from '../dev-tools/watcher';
import type { ModernDevServerOptionsNew } from '../types';
import { workerSSRRender } from './workerSSRRender';

export class ModernDevServer extends ModernServer {
  private mockHandler: ReturnType<typeof createMockHandler> = null;

  private readonly dev: ModernDevServerOptionsNew['dev'];

  private readonly useSSRWorker: boolean;

  private readonly appContext: ModernDevServerOptionsNew['appContext'];

  private getMiddlewares: ModernDevServerOptionsNew['getMiddlewares'];

  private rsbuild: RsbuildInstance;

  private watcher?: Watcher;

  private closeCb: Array<() => Promise<void>> = [];

  constructor(options: ModernDevServerOptionsNew) {
    super(options);

    this.appContext = options.appContext;

    // dev server should work in pwd
    this.workDir = this.pwd;

    this.useSSRWorker = Boolean(options.useSSRWorker);

    // set dev server options, like webpack-dev-server
    this.dev = this.getDevOptions(options);

    this.getMiddlewares = options.getMiddlewares;

    this.rsbuild = options.rsbuild;
  }

  private getDevOptions(options: ModernDevServerOptionsNew) {
    const devOptions = options.dev;
    const defaultOptions = getDefaultDevOptions();
    return deepMerge(defaultOptions, devOptions);
  }

  // Complete the preparation of services
  public async onInit(runner: ServerHookRunner, app: Server) {
    this.runner = runner;
    const { dev } = this;

    const {
      middlewares: rsbuildMiddlewares,
      close,
      onHTTPUpgrade,
    } = this.getMiddlewares();

    app.on('upgrade', onHTTPUpgrade);

    this.rsbuild.onDevCompileDone(({ stats }) => {
      // Reset only when client compile done
      if (stats.toJson({ all: false }).name !== 'server') {
        this.onRepack({ routes: this.getRoutes() });
      }
    });

    await this.applyDefaultMiddlewares();

    this.addHandler((ctx, next) => rsbuildMiddlewares(ctx.req, ctx.res, next));

    this.closeCb.push(close);

    // use webpack Fs to init FileReader
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

  private initFileReader() {
    let isInit = false;

    if (this.dev?.writeToDisk === false) {
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

  public async close() {
    for (const cb of this.closeCb) {
      await cb();
    }
  }

  // override the ModernServer renderHandler logic
  public getRenderHandler(): RenderHandler {
    if (this.useSSRWorker) {
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
    return async (_context: ModernServerContext, next: NextFunction) => {
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
