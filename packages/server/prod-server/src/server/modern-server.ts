/* eslint-disable max-lines */
import { IncomingMessage, ServerResponse, Server, createServer } from 'http';
import util from 'util';
import path from 'path';
import { fs, mime, ROUTE_SPEC_FILE } from '@modern-js/utils';
import { Adapter, APIServerStartInput } from '@modern-js/server-core';
import type { NormalizedConfig } from '@modern-js/core';
import axios from 'axios';
import { clone } from '@modern-js/utils/lodash';
import {
  ModernServerOptions,
  NextFunction,
  ServerHookRunner,
  Metrics,
  Logger,
  ConfWithBFF,
  ModernServerInterface,
  HookNames,
  BuildOptions,
} from '../type';
import {
  RouteMatchManager,
  ModernRouteInterface,
  ModernRoute,
  RouteMatcher,
} from '../libs/route';
import { createRenderHandler } from '../libs/render';
import { createStaticFileHandler } from '../libs/serve-file';
import {
  createErrorDocument,
  createMiddlewareCollecter,
  getStaticReg,
  mergeExtension,
  noop,
  debug,
} from '../utils';
import * as reader from '../libs/render/reader';
import { createProxyHandler, BffProxyOptions } from '../libs/proxy';
import { createContext, ModernServerContext } from '../libs/context';
import {
  AGGRED_DIR,
  ApiServerMode,
  ERROR_DIGEST,
  ERROR_PAGE_TEXT,
  RUN_MODE,
} from '../constants';
import { createTemplateAPI } from '../libs/hook-api/template';
import { createRouteAPI } from '../libs/hook-api/route';

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

export class ModernServer implements ModernServerInterface {
  // appDirectory
  public pwd: string;

  // product dist dir
  public distDir: string;

  // work on src or dist
  protected workDir: string;

  protected router!: RouteMatchManager;

  protected conf: NormalizedConfig;

  protected handlers: ModernServerAsyncHandler[] = [];

  protected presetRoutes?: ModernRouteInterface[];

  protected runner!: ServerHookRunner;

  protected readonly logger: Logger;

  protected readonly metrics: Metrics;

  protected readonly runMode: string;

  protected reader: typeof reader = reader;

  protected readonly proxyTarget: ModernServerOptions['proxyTarget'];

  private staticFileHandler!: ReturnType<typeof createStaticFileHandler>;

  private routeRenderHandler!: ReturnType<typeof createRenderHandler>;

  private frameWebHandler: Adapter | null = null;

  private frameAPIHandler: Adapter | null = null;

  private proxyHandler: ReturnType<typeof createProxyHandler> = null;

  private _handler!: (context: ModernServerContext, next: NextFunction) => void;

  private readonly staticGenerate: boolean;

  constructor({
    pwd,
    config,
    routes,
    staticGenerate,
    logger,
    metrics,
    runMode,
    proxyTarget,
  }: ModernServerOptions) {
    require('ignore-styles');

    this.pwd = pwd;
    this.distDir = path.join(pwd, config.output?.path || 'dist');
    this.workDir = this.distDir;
    this.conf = config;
    debug('server conf', this.conf);
    this.logger = logger!;
    this.metrics = metrics!;
    this.router = new RouteMatchManager();
    this.presetRoutes = routes;
    this.proxyTarget = proxyTarget;
    this.staticGenerate = staticGenerate || false;
    this.runMode = runMode || RUN_MODE.TYPE;
    process.env.BUILD_TYPE = `${this.staticGenerate ? 'ssg' : 'ssr'}`;
  }

  // server prepare
  public async onInit(runner: ServerHookRunner) {
    this.runner = runner;

    const { distDir, staticGenerate, conf } = this;

    debug('final server conf', this.conf);
    // proxy handler, each proxy has own handler
    this.proxyHandler = createProxyHandler(conf.bff?.proxy as BffProxyOptions);
    if (this.proxyHandler) {
      this.proxyHandler.forEach(handler => {
        this.addHandler(handler);
      });
    }

    // start file reader
    this.reader.init();

    // use preset routes priority
    const usageRoutes = this.filterRoutes(this.getRoutes());
    this.router.reset(usageRoutes);

    // warmup ssr bundle in production env
    this.warmupSSRBundle();

    await this.prepareFrameHandler();

    // Only work when without setting `assetPrefix`.
    // Setting `assetPrefix` means these resources should be uploaded to CDN.
    const staticPathRegExp = getStaticReg(this.conf.output || {});
    this.staticFileHandler = createStaticFileHandler([
      {
        path: staticPathRegExp,
        target: distDir,
      },
    ]);

    this.routeRenderHandler = createRenderHandler({
      distDir,
      staticGenerate,
    });

    await this.setupBeforeProdMiddleware();

    this.addHandler(this.staticFileHandler);
    this.addHandler(this.routeHandler.bind(this));

    // compose middlewares to http handler
    this.compose();
  }

  // close any thing run in server
  public async onClose() {
    this.reader.close();
  }

  // server ready
  public onRepack(_: BuildOptions) {
    // empty
  }

  // invoke when http server listen
  public onListening(_: Server) {
    // empty
  }

  protected onServerChange({ filepath }: { filepath: string }) {
    const { pwd } = this;
    const { api, server } = AGGRED_DIR;
    const apiPath = path.normalize(path.join(pwd, api));
    const serverPath = path.normalize(path.join(pwd, server));

    const onlyApi = filepath.startsWith(apiPath);
    const onlyWeb = filepath.startsWith(serverPath);

    this.prepareFrameHandler({ onlyWeb, onlyApi });
  }

  // exposed requestHandler
  public getRequestHandler() {
    return this.requestHandler.bind(this);
  }

  public async createHTTPServer(
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next?: () => void,
    ) => void,
  ) {
    return createServer(handler);
  }

  /* —————————————————————— function will be overwrite —————————————————————— */
  // get routes info
  protected getRoutes() {
    // Preferred to use preset routes
    if (this.presetRoutes) {
      return this.presetRoutes;
    }

    // read routes from spec file
    const file = path.join(this.distDir, ROUTE_SPEC_FILE);
    if (fs.existsSync(file)) {
      const content: { routes: ModernRouteInterface[] } = fs.readJSONSync(file);
      return content.routes;
    }

    return [];
  }

  // add promisify request handler to server
  // handler should do not do more things after invoke next
  protected addHandler(handler: ModernServerHandler) {
    if ((handler as any)[Symbol.toStringTag] === 'AsyncFunction') {
      this.handlers.push(handler as ModernServerAsyncHandler);
    } else {
      this.handlers.push(util.promisify(handler));
    }
  }

  // return 404 page
  protected render404(context: ModernServerContext) {
    context.error(ERROR_DIGEST.ENOTF, '404 Not Found');
    this.renderErrorPage(context, 404);
  }

  // gather frame extension and get framework handler
  protected async prepareFrameHandler(options?: {
    onlyApi: boolean;
    onlyWeb: boolean;
  }) {
    const { workDir, runner } = this;
    const { onlyApi, onlyWeb } = options || {};

    // server hook, gather plugin inject
    const { getMiddlewares, ...collector } = createMiddlewareCollecter();

    await runner.gather(collector);
    const { api: pluginAPIExt, web: pluginWebExt } = getMiddlewares();

    const apiDir = path.join(workDir, API_DIR);
    const serverDir = path.join(workDir, SERVER_DIR);

    // get api or web server handler from server-framework plugin
    if ((await fs.pathExists(path.join(serverDir))) && !onlyApi) {
      const webExtension = mergeExtension(pluginWebExt);
      this.frameWebHandler = await this.prepareWebHandler(webExtension);
    }

    if (fs.existsSync(apiDir) && !onlyWeb) {
      const mode = fs.existsSync(path.join(apiDir, AGGRED_DIR.lambda))
        ? ApiServerMode.frame
        : ApiServerMode.func;

      debug('exists api dir', mode);
      // if use lambda/, mean framework style of writing, then discard user extension
      const apiExtension = mergeExtension(pluginAPIExt);
      this.frameAPIHandler = await this.prepareAPIHandler(mode, apiExtension);
    }
  }

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
    extension: APIServerStartInput['config'],
  ) {
    const { workDir, runner, conf } = this;
    const { bff } = conf as ConfWithBFF;
    const prefix = bff?.prefix || '/api';
    return runner.prepareApiServer(
      {
        pwd: workDir,
        mode,
        config: extension,
        prefix: Array.isArray(prefix) ? prefix[0] : prefix,
      },
      { onLast: () => null as any },
    );
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes;
  }

  protected async emitRouteHook(
    eventName: HookNames,
    input: {
      context: ModernServerContext;
      [propsName: string]: any;
    },
  ) {
    input.context = clone(input.context);
    return this.runner[eventName](input as any, { onLast: noop as any });
  }

  protected async setupBeforeProdMiddleware() {
    const { conf, runner } = this;
    const preMiddleware: ModernServerAsyncHandler[] =
      await runner.beforeProdServer(conf);

    preMiddleware.flat().forEach(mid => {
      this.addHandler(mid);
    });
  }

  protected async handleAPI(context: ModernServerContext) {
    const { req, res } = context;

    if (!this.frameAPIHandler) {
      throw new Error('can not found api handler');
    }

    await this.frameAPIHandler(req, res);
  }

  protected async handleWeb(context: ModernServerContext, route: ModernRoute) {
    return this.routeRenderHandler({
      ctx: context,
      route,
      runner: this.runner,
    });
  }

  protected async proxy() {
    return null as any;
  }

  // warmup ssr function
  protected warmupSSRBundle() {
    const { distDir } = this;
    const bundles = this.router.getBundles();

    bundles.forEach(bundle => {
      const filepath = path.join(distDir, bundle as string);
      // if error, just throw and let process die
      require(filepath);
    });
  }

  /* —————————————————————— private function —————————————————————— */
  // handler route.json, include api / csr / ssr
  private async routeHandler(context: ModernServerContext) {
    const { req, res } = context;

    await this.emitRouteHook('beforeMatch', { context });

    // match routes in the route spec
    const matched = this.router.match(context.path);
    if (!matched) {
      this.render404(context);
      return;
    }

    if (res.headersSent) {
      return;
    }

    const routeAPI = createRouteAPI(matched, this.router, context.url);
    await this.emitRouteHook('afterMatch', { context, routeAPI });

    if (res.headersSent) {
      return;
    }

    const { current }: { current: RouteMatcher } = routeAPI as any;
    const route: ModernRoute = current.generate(context.url);
    context.setParams(route.params);
    context.setServerData('router', {
      baseUrl: route.urlPath,
      params: route.params,
    });

    // route is api service
    if (route.isApi) {
      await this.handleAPI(context);
      return;
    }

    if (this.frameWebHandler) {
      await this.frameWebHandler(req, res);
    }

    // frameWebHandler has process request
    if (res.headersSent) {
      return;
    }

    if (route.entryName) {
      await this.emitRouteHook('beforeRender', { context });
    }

    const file = await this.handleWeb(context, route);
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
      await this.emitRouteHook('afterRender', { context, templateAPI });
      await this.injectMicroFE(context, templateAPI);
      templateAPI.appendHead(
        `<script>window._SERVER_DATA=${JSON.stringify(
          context.serverData,
        )}</script>`,
      );
      response = templateAPI.get();
    }

    res.setHeader('content-type', file.contentType);
    res.end(response);
  }

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
      templateAPI.appendHead(
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
    req.logger = this.logger;
    req.metrics = this.metrics;
    let context: ModernServerContext;
    try {
      context = createContext(req, res);
    } catch (e) {
      this.logger.error(e as Error);
      res.statusCode = 500;
      res.setHeader('content-type', mime.contentType('html') as string);
      return res.end(createErrorDocument(500, ERROR_PAGE_TEXT[500]));
    }

    try {
      return this._handler(context, next);
    } catch (err) {
      return this.onError(context, err as Error);
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
      const route = matched.generate(context.url);
      const { entryName } = route;
      // check entryName, avoid matched '/' route
      if (entryName === status.toString() || entryName === '_error') {
        try {
          const file = await this.routeRenderHandler({
            route,
            ctx: context,
            runner: this.runner,
          });
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
    context.res.end(createErrorDocument(status, text));
  }
}
/* eslint-enable max-lines */
