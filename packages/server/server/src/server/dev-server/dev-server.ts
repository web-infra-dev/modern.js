import http, {
  Server,
  createServer,
  IncomingMessage,
  ServerResponse,
} from 'http';
import path from 'path';
import { createServer as createHttpsServer } from 'https';
import {
  API_DIR,
  HMR_SOCK_PATH,
  SERVER_DIR,
  SHARED_DIR,
} from '@modern-js/utils';
import type { MultiCompiler, Compiler } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { ModernServer } from '../modern-server';
import { createMockHandler } from '../../dev-tools/mock';
import { createProxyHandler, ProxyOptions } from '../../libs/proxy';
import {
  DevServerOptions,
  ModernServerOptions,
  NextFunction,
  ServerHookRunner,
  ReadyOptions,
} from '../../type';
import SocketServer from '../../dev-tools/socket-server';
import DevServerPlugin from '../../dev-tools/dev-server-plugin';
import { ModernServerContext } from '../../libs/context';
import { createLaunchEditorHandler } from '../../dev-tools/launch-editor';
import { enableRegister } from '../../dev-tools/babel/register';
import * as reader from '../../libs/render/reader';
import Watcher from '../../dev-tools/watcher';
import { AGGRED_DIR } from '../../constants';

const DEFAULT_DEV_OPTIONS: DevServerOptions = {
  client: {
    port: '8080',
    overlay: false,
    logging: 'none',
    path: HMR_SOCK_PATH,
    host: 'localhost',
  },
  https: false,
  dev: { writeToDisk: true },
  watch: true,
  hot: true,
  liveReload: true,
};

export class ModernDevServer extends ModernServer {
  private devProxyHandler: ReturnType<typeof createProxyHandler> = null;

  private mockHandler: ReturnType<typeof createMockHandler> = null;

  private readonly dev: DevServerOptions;

  private readonly compiler?: MultiCompiler | Compiler;

  private socketServer!: SocketServer;

  private watcher!: Watcher;

  private devMiddleware!: webpackDevMiddleware.API<
    http.IncomingMessage,
    http.ServerResponse
  >;

  constructor(options: ModernServerOptions) {
    super(options);

    // set webpack compiler
    this.compiler = options.compiler!;

    // set dev server options, like webpack-dev-server
    this.dev =
      typeof options.dev === 'boolean'
        ? DEFAULT_DEV_OPTIONS
        : { ...DEFAULT_DEV_OPTIONS, ...options.dev };

    enableRegister(this.pwd, this.conf);
  }

  // Complete the preparation of services
  public async init(runner: ServerHookRunner) {
    const { conf, pwd, compiler } = this;

    // mock handler
    this.mockHandler = createMockHandler({ pwd });
    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      ctx.res.setHeader('Access-Control-Allow-Origin', '*');
      ctx.res.setHeader('Access-Control-Allow-Credentials', 'false');

      if (this.mockHandler) {
        this.mockHandler(ctx, next);
      } else {
        next();
      }
    });

    // dev proxy handler, each proxy has own handler
    this.devProxyHandler = createProxyHandler(
      conf.tools?.devServer?.proxy as ProxyOptions,
    );
    if (this.devProxyHandler) {
      this.devProxyHandler.forEach(handler => {
        this.addHandler(handler);
      });
    }

    // do webpack build / plugin apply / socket server when pass compiler instance
    if (compiler) {
      // init socket server
      this.socketServer = new SocketServer(this.dev);

      // open file in edtor.
      this.addHandler(createLaunchEditorHandler());

      // setup compiler in server, also add dev-middleware to handler static file in memory
      const devMiddlewareHandler = this.setupCompiler(compiler);
      this.addHandler(devMiddlewareHandler);
    }

    await super.init(runner);

    // watch mock/ server/ api/ dir file change
    if (this.dev.watch) {
      this.startWatcher();
    }
  }

  public ready(options: ReadyOptions = {}) {
    // reset the routing management instance every times the service starts
    this.router.reset(
      this.filterRoutes(options.routes || this.presetRoutes || []),
    );
    this.cleanSSRCache();

    // reset static file
    reader.updateFile();

    this.runner.reset();
  }

  public onListening(app: Server) {
    this.socketServer?.prepare(app);
  }

  public async close() {
    super.close();
    await this.watcher.close();
    await new Promise<void>(resolve => {
      this.devMiddleware.close(() => {
        resolve();
      });
    });
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
      const { genHttpsOptions } = require('../../dev-tools/https');
      const httpsOptions = await genHttpsOptions(devHttpsOption);
      return createHttpsServer(httpsOptions, handler);
    } else {
      return createServer(handler);
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
      const { compile, invalid, done } = compiler.hooks;

      compile.tap('modern-dev-server', invalidPlugin);
      invalid.tap('modern-dev-server', invalidPlugin);
      done.tap('modern-dev-server', (stats: any) => {
        this.socketServer.updateStats(stats);

        // Reset only when client compile done
        if (stats.toJson({ all: false }).name === 'client') {
          this.ready({ routes: this.readRouteSpec() });
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
    this.devMiddleware = webpackDevMiddleware(compiler, {
      publicPath: '/',
      writeToDisk: this.dev.dev.writeToDisk,
      stats: false,
    });

    return (ctx: ModernServerContext, next: NextFunction) => {
      const { req, res } = ctx;
      this.devMiddleware(req, res, next);
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
  }

  private startWatcher() {
    const { pwd } = this;
    const { mock } = AGGRED_DIR;
    const defaultWatched = [
      `${pwd}/${mock}/**/*`,
      `${pwd}/${SERVER_DIR}/**/*`,
      `${pwd}/${API_DIR}/!(typings)/**`,
      `${pwd}/${SHARED_DIR}/**/*`,
    ];

    const watcher = new Watcher();
    watcher.createDepTree();

    // 监听文件变动，如果有变动则给 client，也就是 start 启动的插件发消息
    watcher.listen(defaultWatched, (filepath: string) => {
      watcher.updateDepTree();
      watcher.cleanDepCache(filepath);

      this.runner.reset();

      if (filepath.startsWith(`${pwd}/${mock}`)) {
        this.mockHandler = createMockHandler({ pwd });
      } else {
        try {
          this.prepareFrameHandler();
        } catch (e) {
          this.logger.error(e as Error);
        }
      }
    });

    this.watcher = watcher;
  }
}
