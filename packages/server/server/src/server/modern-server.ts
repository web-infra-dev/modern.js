/* eslint-disable max-lines */
import { IncomingMessage, ServerResponse, Server } from 'http';
import util from 'util';
import path from 'path';
import { fs, ROUTE_SPEC_FILE } from '@modern-js/utils';
import { Adapter } from '@modern-js/server-plugin';
import { gather, createMiddlewareCollecter } from '@modern-js/server-utils';
import type { NormalizedConfig } from '@modern-js/core';
import mime from 'mime-types';
import axios from 'axios';
import {
  ModernServerOptions,
  NextFunction,
  ServerHookRunner,
  Measure,
  Logger,
  ReadyOptions,
  ConfWithBFF,
} from '../type';
import { RouteMatchManager, ModernRouteInterface } from '../libs/route';
import { createRenderHandler } from '../libs/render';
import { createStaticFileHandler } from '../libs/serve-file';
import { createErrorDocument, mergeExtension, noop } from '../utils';
import * as reader from '../libs/render/reader';
import { createProxyHandler, ProxyOptions } from '../libs/proxy';
import { createContext, ModernServerContext } from '@/libs/context';
import {
  AGGRED_DIR,
  ApiServerMode,
  ERROR_DIGEST,
  ERROR_PAGE_TEXT,
} from '@/constants';
import { createTemplateAPI } from '@/libs/hook-api';

type ModernServerHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void> | void;

type ModernServerAsyncHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void>;

const API_DIR = './api';
const SERVER_DIR = './server';

export class ModernServer {
  // appDirectory
  protected pwd: string;

  // product dist dir
  protected distDir: string;

  // work on src or dist
  protected workDir: string;

  protected router!: RouteMatchManager;

  protected conf: NormalizedConfig;

  protected handlers: ModernServerAsyncHandler[] = [];

  protected presetRoutes?: ModernRouteInterface[];

  protected readonly logger: Logger;

  protected readonly measure: Measure;

  private readonly runner: ServerHookRunner;

  private readonly isDev: boolean = false;

  private staticFileHandler!: ReturnType<typeof createStaticFileHandler>;

  private routeRenderHandler!: ReturnType<typeof createRenderHandler>;

  private frameWebHandler: Adapter | null = null;

  private frameAPIHandler: Adapter | null = null;

  private _handler!: (context: ModernServerContext, next: NextFunction) => void;

  private readonly staticGenerate: boolean = false;

  private proxyHandler: ReturnType<typeof createProxyHandler> = null;

  constructor(
    {
      pwd,
      config,
      dev,
      routes,
      staticGenerate,
      logger,
      measure,
    }: ModernServerOptions,
    runner: ServerHookRunner,
  ) {
    require('ignore-styles');
    this.isDev = Boolean(dev);

    this.pwd = pwd;
    this.distDir = path.join(pwd, config.output.path || '');
    this.workDir = this.isDev ? pwd : this.distDir;
    this.conf = config;
    this.runner = runner;
    this.logger = logger!;
    this.measure = measure!;
    this.router = new RouteMatchManager();
    this.presetRoutes = routes;

    if (staticGenerate) {
      this.staticGenerate = staticGenerate;
    }
    process.env.BUILD_TYPE = `${this.staticGenerate ? 'ssg' : 'ssr'}`;
  }

  // exposed requestHandler
  public getRequestHandler() {
    return this.requestHandler.bind(this);
  }

  // server prepare
  public async init() {
    const { distDir, isDev, staticGenerate, conf } = this;

    this.addHandler((ctx: ModernServerContext, next: NextFunction) => {
      ctx.res.setHeader('Access-Control-Allow-Origin', '*');
      ctx.res.setHeader('Access-Control-Allow-Credentials', 'false');
      next();
    });

    // proxy handler, each proxy has own handler
    this.proxyHandler = createProxyHandler(conf.bff?.proxy as ProxyOptions);
    if (this.proxyHandler) {
      this.proxyHandler.forEach(handler => {
        this.addHandler(handler);
      });
    }

    // start reader, include an time interval
    reader.init();

    // use preset routes priority
    this.router.reset(
      this.filterRoutes(this.presetRoutes || this.readRouteSpec()),
    );

    if (!isDev) {
      // The route spec may not be produced at this phase in development
      this.warmupSSRBundle();
    }

    await this.prepareFrameHandler();

    this.staticFileHandler = createStaticFileHandler([
      {
        path: '/static/',
        target: path.join(distDir, 'static'),
      },
      {
        path: '/upload/',
        target: path.join(distDir, 'upload'),
      },
    ]);

    this.routeRenderHandler = createRenderHandler({
      distDir,
      staticGenerate,
    });

    await this.preServerInit();

    this.addHandler(this.staticFileHandler);
    this.addHandler(this.routeHandler.bind(this));

    this.compose();
  }

  // server ready
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public ready(_: ReadyOptions) {}

  // invoke when http server listen
  public onListening(_: Server) {
    // empty
  }

  // close any thing run in server
  public close() {
    reader.close();
  }

  // warmup ssr function
  protected warmupSSRBundle() {
    const { distDir } = this;
    const bundles = this.router.getBundles();

    bundles.forEach(bundle => {
      const filepath = path.join(distDir, bundle!);
      // if error, just throw and let process die
      require(filepath);
    });
  }

  // read route spec from route.json
  protected readRouteSpec() {
    const file = path.join(this.distDir, ROUTE_SPEC_FILE);

    if (fs.existsSync(file)) {
      const content: { routes: ModernRouteInterface[] } = fs.readJSONSync(file);
      return content.routes;
    }

    return [];
  }

  // add promisify request handler to server
  protected addHandler(handler: ModernServerHandler) {
    if ((handler as any)[Symbol.toStringTag] === 'AsyncFunction') {
      this.handlers.push(handler as ModernServerAsyncHandler);
    } else {
      this.handlers.push(util.promisify(handler));
    }
  }

  // return 404 page
  protected render404(context: ModernServerContext) {
    context.error(ERROR_DIGEST.ENOTF);
    this.renderErrorPage(context, 404);
  }

  // gather frame extension and get framework handler
  protected async prepareFrameHandler() {
    const { workDir, runner } = this;

    // inner tool, gather user inject
    const { api: userAPIExt, web: userWebExt } = gather(workDir);

    // server hook, gather plugin inject
    const { getMiddlewares, ...collector } = createMiddlewareCollecter();

    await runner.gather(collector);
    const { api: pluginAPIExt, web: pluginWebExt } = getMiddlewares();

    const apiDir = path.join(workDir, API_DIR);
    const serverDir = path.join(workDir, SERVER_DIR);

    // get api or web server handler from server-framework plugin
    if (await fs.pathExists(path.join(serverDir))) {
      const webExtension = mergeExtension(pluginWebExt, userWebExt);
      this.frameWebHandler = await this.prepareWebHandler(webExtension);
    }

    if (fs.existsSync(apiDir)) {
      const mode = fs.existsSync(path.join(apiDir, AGGRED_DIR.lambda))
        ? ApiServerMode.frame
        : ApiServerMode.func;

      // if use lambda/, mean framework style of writing, then discard user extension
      const apiExtension = mergeExtension(
        pluginAPIExt,
        mode === ApiServerMode.frame ? [] : userAPIExt,
      );
      this.frameAPIHandler = await this.prepareAPIHandler(mode, apiExtension);
    }
  }

  /* —————————————————————— function will be overwrite —————————————————————— */
  protected async prepareWebHandler(
    extension: ReturnType<typeof mergeExtension>,
  ) {
    const { workDir, runner } = this;

    return runner.prepareWebServer(
      {
        pwd: workDir,
        config: extension,
      },
      { onLast: () => null as any },
    );
  }

  protected async prepareAPIHandler(
    mode: ApiServerMode,
    extension: ReturnType<typeof mergeExtension>,
  ) {
    const { workDir, runner, conf } = this;
    const { bff } = conf as ConfWithBFF;
    const prefix = bff?.prefix || '/api';

    return runner.prepareApiServer(
      {
        pwd: workDir,
        mode,
        config: extension,
        prefix,
      },
      { onLast: () => null as any },
    );
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes;
  }

  protected async preServerInit() {
    const { conf } = this;
    const preMiddleware: ModernServerAsyncHandler[] =
      await this.runner.preServerInit(conf);

    preMiddleware.forEach(mid => {
      this.addHandler(mid);
    });
  }

  /* —————————————————————— private function —————————————————————— */

  // handler route.json, include api / csr / ssr
  // eslint-disable-next-line max-statements
  private async routeHandler(context: ModernServerContext) {
    const { req, res } = context;

    // match routes in the route spec
    const matched = this.router.match(context.url);
    if (!matched) {
      this.render404(context);
      return;
    }

    const route = matched.generate();
    const params = matched.parseURLParams(context.url);
    context.setParams(params);

    // route is api service
    if (route.isApi) {
      if (!this.frameAPIHandler) {
        throw new Error('can not found api hanlder');
      }

      await this.frameAPIHandler(req, res);
      return;
    }

    if (this.frameWebHandler) {
      await this.frameWebHandler(req, res);
    }

    // frameWebHandler has process request
    if (res.headersSent) {
      return;
    }

    const file = await this.routeRenderHandler(context, route);
    if (!file) {
      this.render404(context);
      return;
    }

    if (file.redirect) {
      res.statusCode = file.statusCode!;
      res.setHeader('Location', file.content as string);
      res.end();
      return;
    }

    let response = file.content;
    if (route.entryName) {
      const templateAPI = createTemplateAPI(file.content.toString());
      await this.runner.afterRender(
        { context, templateAPI },
        { onLast: noop as any },
      );
      await this.injectMicroFE(context, templateAPI);
      response = templateAPI.get();
    }

    res.setHeader('content-type', file.contentType);
    res.end(response);
  }

  // eslint-disable-next-line max-statements
  private async injectMicroFE(
    context: ModernServerContext,
    templateAPI: ReturnType<typeof createTemplateAPI>,
  ) {
    const { conf } = this;
    const masterApp = conf.runtime?.masterApp;
    // no inject if not master App
    if (!masterApp) {
      return;
    }

    const manifest = masterApp.manifest || {};
    let modules = [];
    const { modules: configModules = [] } = manifest;

    // while config modules is an string, fetch data from remote
    if (typeof configModules === 'string') {
      const moduleRequestUrl = configModules;
      try {
        const { data: remoteModules } = await axios.get(moduleRequestUrl);
        if (Array.isArray(remoteModules)) {
          modules.push(...remoteModules);
        }
      } catch (e) {
        context.error(ERROR_DIGEST.EMICROINJ, e as Error);
      }
    } else if (Array.isArray(configModules)) {
      modules.push(...configModules);
    }

    const { headers } = context.req;

    const debugName =
      headers['x-micro-frontend-module-name'] ||
      context.query['__debug__micro-frontend-module-name'];

    const debugEntry =
      headers['x-micro-frontend-module-entry'] ||
      context.query['__debug__micro-frontend-module-entry'];

    // add debug micro App to first
    if (debugName && debugEntry && conf.server?.enableMicroFrontendDebug) {
      modules = modules.map(m => {
        if (m.name === debugName) {
          return {
            name: debugName,
            entry: debugEntry,
          };
        }

        return m;
      });
    }

    try {
      // Todo Safety xss
      const injection = JSON.stringify({ ...manifest, modules });
      templateAPI.afterHead(
        `<script>window.modern_manifest=${injection}</script>`,
      );
    } catch (e) {
      context.error(ERROR_DIGEST.EMICROINJ, e as Error);
    }
  }

  // compose handlers and create the final handler
  private compose() {
    const { handlers } = this;

    if (!Array.isArray(handlers)) {
      throw new TypeError('Middleware stack must be an array!');
    }
    for (const fn of handlers) {
      if (typeof fn !== 'function') {
        throw new TypeError('Middleware must be composed of functions!');
      }
    }

    this._handler = (context: ModernServerContext, next: NextFunction) => {
      let i = 0;
      const dispatch = () => {
        const handler = handlers[i++];
        if (!handler) {
          return next();
        }

        // eslint-disable-next-line promise/prefer-await-to-then
        return handler(context, dispatch as NextFunction).catch(onError);
      };

      const onError = (err: Error) => {
        this.onError(context, err);
      };
      return dispatch();
    };
  }

  private requestHandler(
    req: IncomingMessage,
    res: ServerResponse,
    next = () => {
      // empty
    },
  ) {
    res.statusCode = 200;
    const context: ModernServerContext = createContext(req, res, {
      logger: this.logger,
      measure: this.measure,
    });

    try {
      this._handler(context, next);
    } catch (err) {
      this.onError(context, err as Error);
    }
  }

  private onError(context: ModernServerContext, err: Error) {
    context.error(ERROR_DIGEST.EINTER, err);
    this.renderErrorPage(context, 500);
  }

  private async renderErrorPage(context: ModernServerContext, status: number) {
    const { res } = context;
    context.status = status;
    res.setHeader('content-type', mime.contentType('html') as string);

    const statusPage = `/${status}`;
    const customErrorPage = `/_error`;

    const matched =
      this.router.match(statusPage) || this.router.match(customErrorPage);
    // if no custom status page find
    if (matched) {
      const route = matched.generate();
      const { entryName } = route;
      // check entryName, aviod matched '/' route
      if (entryName === status.toString() || entryName === '_error') {
        try {
          const file = await this.routeRenderHandler(context, route);
          if (file) {
            context.res.end(file.content);
            return;
          }
        } catch (e) {
          // just catch error when the rendering error occurred in the custom error page.
        }
      }
    }

    const text = ERROR_PAGE_TEXT[status] || ERROR_PAGE_TEXT[500];
    res.end(createErrorDocument(status, text));
  }
}
/* eslint-enable max-lines */
