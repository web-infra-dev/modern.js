import http, {
  Server,
  createServer,
  IncomingMessage,
  ServerResponse,
} from 'http';
import path from 'path';
import { createServer as createHttpsServer } from 'https';
import { API_DIR, SERVER_DIR, SHARED_DIR } from '@modern-js/utils';
import type { MultiCompiler, Compiler } from '@modern-js/webpack';
import webpackDevMiddleware, {
  Headers,
} from '@modern-js/webpack/webpack-dev-middleware';
import {
  createProxyHandler,
  NextFunction,
  ServerHookRunner,
  ModernServer,
  AGGRED_DIR,
  BuildOptions,
} from '@modern-js/prod-server';
import { ModernServerContext } from '@modern-js/types';
import { getDefaultDevOptions } from '../constants';
import { createMockHandler } from '../dev-tools/mock';
import SocketServer from '../dev-tools/socket-server';
import DevServerPlugin from '../dev-tools/dev-server-plugin';
import { enableRegister } from '../dev-tools/babel/register';
import Watcher, { mergeWatchOptions, WatchEvent } from '../dev-tools/watcher';
import { DevServerOptions, ModernDevServerOptions } from '../types';

export class ModernDevServer extends ModernServer {
  private mockHandler: ReturnType<typeof createMockHandler> = null;

  private readonly dev: DevServerOptions;

  private readonly compiler?: MultiCompiler | Compiler;

  private socketServer!: SocketServer;

  private watcher!: Watcher;

  private devMiddleware!: webpackDevMiddleware.API<
    http.IncomingMessage,
    http.ServerResponse
  >;

  constructor(options: ModernDevServerOptions) {
    super(options);

    // dev server should work in pwd
    this.workDir = this.pwd;

    // set webpack compiler
    this.compiler = options.compiler!;

    // set dev server options, like webpack-dev-server
    this.dev = this.getDevOptions(options);

    enableRegister(this.pwd, this.conf);
  }

  private getDevOptions(options: ModernDevServerOptions) {
    const devOptions = typeof options.dev === 'boolean' ? {} : options.dev;
    const defaultOptions = getDefaultDevOptions();

    return {
      ...defaultOptions,
      ...devOptions,
      client: {
        ...defaultOptions.client,
        ...devOptions?.client,
      },
    };
  }

  // Complete the preparation of services
  public async onInit(runner: ServerHookRunner) {
    this.runner = runner;

    const { conf, pwd, compiler, dev } = this;
    // before dev handler
    const beforeHandlers = await this.setupBeforeDevMiddleware();
    beforeHandlers.forEach(handler => {
      this.addHandler((ctx, next) => {
        const { req, res } = ctx;
        return handler(req, res, next);
      });
    });

    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      // allow hmr request cross-domain, because the user may use global proxy
      if (ctx.path.includes('hot-update')) {
        ctx.res.setHeader('Access-Control-Allow-Origin', '*');
        ctx.res.setHeader('Access-Control-Allow-Credentials', 'false');
      }

      // 用户在 devServer 上配置的 headers 不会对 html 的请求生效，加入下面代码，使配置的 headers 对所有请求生效
      const confHeaders = this.conf.tools.devServer?.headers;
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
    const proxyHandlers = createProxyHandler(conf.tools?.devServer?.proxy);
    if (proxyHandlers) {
      proxyHandlers.forEach(handler => {
        this.addHandler(handler);
      });
    }

    // do webpack build / plugin apply / socket server when pass compiler instance
    if (compiler) {
      // init socket server
      this.socketServer = new SocketServer(dev);

      // setup compiler in server, also add dev-middleware to handler static file in memory
      const devMiddlewareHandler = this.setupCompiler(compiler);
      this.addHandler(devMiddlewareHandler);
    }

    // after dev handler
    const afterHandlers = await this.setupAfterDevMiddleware();
    afterHandlers.forEach(handler => {
      this.addHandler((ctx, next) => {
        const { req, res } = ctx;
        return handler(req, res, next);
      });
    });

    await super.onInit(runner);

    // watch mock/ server/ api/ dir file change
    if (dev.watch) {
      this.startWatcher();
    }
  }

  public async onClose() {
    await super.onClose();
    await this.watcher.close();
    await new Promise<void>(resolve => {
      if (this.devMiddleware) {
        this.devMiddleware.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    this.socketServer?.close();
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

    super.onRepack(options);
  }

  public onListening(app: Server) {
    this.socketServer?.prepare(app);
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
      const httpsOptions = await genHttpsOptions(devHttpsOption);
      return createHttpsServer(httpsOptions, handler);
    } else {
      return createServer(handler);
    }
  }

  protected warmupSSRBundle() {
    // not warmup ssr bundle on development
  }

  protected onServerChange({
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (success !== true) {
          super.onServerChange({ filepath });
        }
      } catch (e) {
        this.logger.error(e as Error);
      }
    }
  }

  // set up plugin to each compiler
  // register hooks for each compilation, update socket stats if recompiled
  // start dev middleware
  private setupCompiler(compiler: MultiCompiler | Compiler) {
    this.setupDevServerPlugin(compiler);
    this.setupHooks();
    return this.setupDevMiddleware(compiler);
  }

  private setupDevServerPlugin(compiler: MultiCompiler | Compiler) {
    const { dev: devConf } = this;

    if ((compiler as MultiCompiler).compilers) {
      (compiler as MultiCompiler).compilers.forEach(target => {
        if (target.name === 'client') {
          new DevServerPlugin(devConf).apply(target);
        }
      });
    } else {
      new DevServerPlugin(devConf).apply(compiler as Compiler);
    }
  }

  private setupHooks() {
    const invalidPlugin = () => {
      this.socketServer.sockWrite('invalid');
    };

    const addHooks = (compiler: Compiler) => {
      if (compiler.name === 'server') {
        return;
      }

      const { compile, invalid, done } = compiler.hooks;

      compile.tap('modern-dev-server', invalidPlugin);
      invalid.tap('modern-dev-server', invalidPlugin);
      done.tap('modern-dev-server', (stats: any) => {
        this.socketServer.updateStats(stats);

        // Reset only when client compile done
        if (stats.toJson({ all: false }).name === 'client') {
          this.onRepack({ routes: this.getRoutes() });
        }
      });
    };

    if ((this.compiler as MultiCompiler).compilers) {
      (this.compiler as MultiCompiler).compilers.forEach(addHooks);
    } else {
      addHooks(this.compiler as Compiler);
    }
  }

  private setupDevMiddleware(compiler: MultiCompiler | Compiler) {
    const { conf } = this;
    this.devMiddleware = webpackDevMiddleware(compiler, {
      headers: conf.tools?.devServer?.headers as Headers<
        IncomingMessage,
        ServerResponse
      >,
      publicPath: '/',
      stats: false,
      ...this.dev.devMiddleware,
    });

    return (ctx: ModernServerContext, next: NextFunction) => {
      const { req, res } = ctx;
      this.devMiddleware(req, res, next);
    };
  }

  private async setupBeforeDevMiddleware() {
    const { runner, conf } = this;

    const setupMids = conf.tools.devServer?.before || [];
    const pluginMids = await runner.beforeDevServer(conf);

    return [...setupMids, ...pluginMids].flat();
  }

  private async setupAfterDevMiddleware() {
    const { runner, conf } = this;

    const setupMids = conf.tools.devServer?.after || [];
    const pluginMids = await runner.afterDevServer(conf);

    return [...pluginMids, ...setupMids].flat();
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
  }

  private startWatcher() {
    const { pwd } = this;
    const { mock } = AGGRED_DIR;
    const defaultWatched = [
      `${mock}/**/*`,
      `${SERVER_DIR}/**/*`,
      `${API_DIR}/**`,
      `${SHARED_DIR}/**/*`,
    ];

    const watchOptions = mergeWatchOptions(this.conf.server.watchOptions);

    const defaultWatchedPaths = defaultWatched.map(p =>
      path.normalize(path.join(pwd, p)),
    );

    const watcher = new Watcher();
    watcher.createDepTree();

    // 监听文件变动，如果有变动则给 client，也就是 start 启动的插件发消息
    watcher.listen(defaultWatchedPaths, watchOptions, (filepath, event) => {
      watcher.updateDepTree();
      watcher.cleanDepCache(filepath);

      this.onServerChange({
        filepath,
        event,
      });
    });

    this.watcher = watcher;
  }
}
