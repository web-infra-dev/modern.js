/* eslint-disable max-lines */
import { IncomingMessage, ServerResponse, Server, createServer } from 'http';
import path from 'path';
import {
  fs,
  isPromise,
  isWebOnly,
  mime,
  ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import {
  Adapter,
  WebAdapter,
  APIServerStartInput,
  ServerOptions,
  LoaderHandler,
} from '@modern-js/server-core';
import type { ModernServerContext, ServerRoute } from '@modern-js/types';
import type { ContextOptions } from '../libs/context';
import {
  ModernServerOptions,
  NextFunction,
  ServerHookRunner,
  Metrics,
  Logger,
  ConfWithBFF,
  ModernServerInterface,
  BuildOptions,
  ModernServerHandler,
} from '../type';
import {
  RouteMatchManager,
  ModernRouteInterface,
  ModernRoute,
} from '../libs/route';
import { RenderHandler, createRenderHandler } from '../libs/render';
import {
  createStaticFileHandler,
  faviconFallbackHandler,
} from '../libs/serveFile';
import {
  createErrorDocument,
  createMiddlewareCollecter,
  getStaticReg,
  mergeExtension,
  noop,
  debug,
  isRedirect,
  bodyParser,
} from '../utils';
import * as reader from '../libs/render/reader';
import { createProxyHandler, BffProxyOptions } from '../libs/proxy';
import { createContext } from '../libs/context';
import {
  AGGRED_DIR,
  ERROR_DIGEST,
  ERROR_PAGE_TEXT,
  RUN_MODE,
} from '../constants';
import {
  createAfterMatchContext,
  createAfterRenderContext,
  createMiddlewareContext,
} from '../libs/hook-api';

type ModernServerAsyncHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void>;

const SERVER_DIR = './server';

export class ModernServer implements ModernServerInterface {
  // appDirectory
  public pwd: string;

  // product dist dir
  public distDir: string;

  // work on src or dist
  protected workDir: string;

  protected router!: RouteMatchManager;

  protected conf: ServerOptions;

  protected handlers: ModernServerAsyncHandler[] = [];

  protected presetRoutes?: ModernRouteInterface[];

  protected runner!: ServerHookRunner;

  protected readonly logger: Logger;

  protected readonly metrics: Metrics;

  protected readonly runMode: string;

  protected reader: typeof reader = reader;

  protected readonly proxyTarget: ModernServerOptions['proxyTarget'];

  protected routeRenderHandler!: RenderHandler;

  protected readonly staticGenerate: boolean;

  protected readonly metaName?: string;

  private loaderHandler: LoaderHandler | null = null;

  private frameWebHandler: WebAdapter | null = null;

  private frameAPIHandler: Adapter | null = null;

  private proxyHandler: ReturnType<typeof createProxyHandler> = null;

  private _handler!: (context: ModernServerContext, next: NextFunction) => void;

  constructor({
    pwd,
    config,
    routes,
    staticGenerate,
    logger,
    metrics,
    runMode,
    proxyTarget,
    appContext,
  }: ModernServerOptions) {
    require('ignore-styles');

    this.pwd = pwd;
    this.distDir = path.resolve(pwd, config.output.path || 'dist');
    this.workDir = this.distDir;
    this.conf = config;
    debug('server conf', this.conf);
    this.logger = logger!;
    this.metrics = metrics!;
    this.router = new RouteMatchManager();
    this.presetRoutes = routes;
    this.proxyTarget = proxyTarget;
    this.staticGenerate = staticGenerate || false;
    this.runMode = runMode || RUN_MODE.FULL;
    this.metaName = appContext?.metaName;
    // process.env.BUILD_TYPE = `${this.staticGenerate ? 'ssg' : 'ssr'}`;
  }

  // server prepare
  public async onInit(runner: ServerHookRunner, app: Server) {
    this.runner = runner;

    const { distDir, conf } = this;

    this.initReader();

    debug('final server conf', this.conf);
    // proxy handler, each proxy has own handler
    this.proxyHandler = createProxyHandler(conf.bff?.proxy as BffProxyOptions);
    if (this.proxyHandler) {
      this.proxyHandler.forEach(handler => {
        this.addHandler(handler);
      });
    }

    // the app server maybe a `undefined`;
    app?.on('close', () => {
      this.reader.close();
    });

    // use preset routes priority
    const usageRoutes = this.filterRoutes(this.getRoutes());
    this.router.reset(usageRoutes);

    // warmup ssr bundle in production env
    this.warmupSSRBundle();

    await this.prepareFrameHandler();
    await this.prepareLoaderHandler(usageRoutes, distDir);

    this.routeRenderHandler = this.getRenderHandler();
    await this.setupBeforeProdMiddleware();

    // Only work when without setting `assetPrefix`.
    // Setting `assetPrefix` means these resources should be uploaded to CDN.
    this.addHandler(this.setupStaticMiddleware(this.conf.output?.assetPrefix));

    // execute after staticFileHandler, can rename to staticFallbackHandler if needed.
    this.addHandler(faviconFallbackHandler);

    this.addHandler(this.routeHandler.bind(this));

    // compose middlewares to http handler
    this.compose();
  }

  public getRenderHandler() {
    const { distDir, staticGenerate, conf, metaName } = this;
    const ssrConfig = this.conf.server?.ssr;
    const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;

    return createRenderHandler({
      distDir,
      staticGenerate,
      forceCSR,
      nonce: conf.security?.nonce,
      metaName,
    });
  }

  // server ready
  public onRepack(_: BuildOptions) {
    // empty
  }

  // exposed requestHandler
  public getRequestHandler() {
    return this.requestHandler.bind(this);
  }

  public async render(req: IncomingMessage, res: ServerResponse, url?: string) {
    req.logger = req.logger || this.logger;
    req.metrics = req.metrics || this.metrics;
    const context = createContext(req, res);
    const matched = this.router.match(url || context.path);
    if (!matched) {
      return null;
    }

    const route = matched.generate(context.url);
    const result = await this.handleWeb(context, route);

    if (!result) {
      return null;
    }

    if (result.contentStream) {
      return result.contentStream;
    }

    return result.content.toString();
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
  protected initReader() {
    this.reader.init();
  }

  protected async onServerChange({ filepath }: { filepath: string }) {
    const { pwd } = this;
    const { api, server } = AGGRED_DIR;
    const apiPath = path.normalize(path.join(pwd, api));
    const serverPath = path.normalize(path.join(pwd, server));

    const onlyApi = filepath.startsWith(apiPath);
    const onlyWeb = filepath.startsWith(serverPath);

    await this.prepareFrameHandler({ onlyWeb, onlyApi });
  }

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
    this.handlers.push(handler as ModernServerAsyncHandler);
  }

  // return 404 page
  protected render404(context: ModernServerContext) {
    context.error(ERROR_DIGEST.ENOTF, '404 Not Found');
    this.renderErrorPage(context, 404);
  }

  protected async prepareLoaderHandler(specs: ServerRoute[], distDir: string) {
    const { runner } = this;

    const handler = await runner.prepareLoaderHandler(
      {
        serverRoutes: specs,
        distDir,
      },
      {
        onLast: () => null as any,
      },
    );

    this.loaderHandler = handler;
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

    const serverDir = path.join(workDir, SERVER_DIR);

    // get api or web server handler from server-framework plugin
    if ((await fs.pathExists(path.join(serverDir))) && !onlyApi) {
      const webExtension = mergeExtension(pluginWebExt);
      this.frameWebHandler = await this.prepareWebHandler(webExtension);
    }

    if (!onlyWeb) {
      const apiExtension = mergeExtension(pluginAPIExt);
      this.frameAPIHandler = await this.prepareAPIHandler(apiExtension);
    }
  }

  protected async prepareWebHandler(
    extension: ReturnType<typeof mergeExtension>,
  ) {
    const { workDir, runner } = this;

    const handler = await runner.prepareWebServer(
      {
        pwd: workDir,
        config: extension,
      },
      { onLast: () => null as any },
    );

    return handler;
  }

  protected async prepareAPIHandler(extension: APIServerStartInput['config']) {
    const { workDir, runner, conf } = this;
    const { bff } = conf as ConfWithBFF;
    const prefix = bff?.prefix || '/api';
    const webOnly = await isWebOnly();
    if (webOnly && process.env.NODE_ENV === 'development') {
      return (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'text/plain');
        res.end(JSON.stringify(''));
      };
    }
    return runner.prepareApiServer(
      {
        pwd: workDir,
        config: extension,
        prefix: Array.isArray(prefix) ? prefix[0] : prefix,
        httpMethodDecider: bff?.httpMethodDecider,
        render: this.render.bind(this),
      },
      { onLast: () => null as any },
    );
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes;
  }

  protected async setupBeforeProdMiddleware() {
    const { conf, runner } = this;
    const preMiddleware: ModernServerAsyncHandler[] =
      await runner.beforeProdServer(conf);

    preMiddleware.flat().forEach(mid => {
      this.addHandler(mid);
    });
  }

  protected setupStaticMiddleware(prefix?: string) {
    const staticPathRegExp = getStaticReg(
      this.conf.output,
      this.conf.html,
      prefix,
    );

    return createStaticFileHandler(
      [
        {
          path: staticPathRegExp,
          target: this.distDir,
        },
      ],
      prefix,
    );
  }

  protected async handleAPI(context: ModernServerContext) {
    const { req, res } = context;

    if (!this.frameAPIHandler) {
      throw new Error('can not found api handler');
    }

    await this.frameAPIHandler(req, res);
  }

  protected async handleWeb(context: ModernServerContext, route: ModernRoute) {
    const { res } = context;

    if (this.loaderHandler) {
      await this.loaderHandler(context);

      if (this.isSend(res)) {
        return null;
      }
    }

    context.setParams(route.params);
    context.setServerData('router', {
      baseUrl: route.urlPath,
      params: route.params,
    });

    if (route.responseHeaders) {
      Object.keys(route.responseHeaders).forEach(key => {
        const value = route.responseHeaders![key];
        if (value) {
          context.res.setHeader(key, value);
        }
      });
    }

    const renderResult = await this.routeRenderHandler({
      ctx: context,
      route,
      runner: this.runner,
    });

    if (!renderResult) {
      this.render404(context);
      return null;
    }

    // React Router navigation
    if (renderResult.redirect) {
      this.redirect(
        res,
        renderResult.content as string,
        renderResult.statusCode,
      );
      return null;
    }

    if (this.isSend(res)) {
      return null;
    }

    res.setHeader('content-type', renderResult.contentType);
    return renderResult;
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
      if (fs.existsSync(filepath)) {
        require(filepath);
      }
    });
  }

  protected createContext(
    req: IncomingMessage,
    res: ServerResponse,
    options: ContextOptions = {},
  ) {
    return createContext(req, res, options);
  }

  /* —————————————————————— private function —————————————————————— */
  // handler route.json, include api / csr / ssr
  private async routeHandler(context: ModernServerContext) {
    const { res, req } = context;

    // parse request body from readable stream to assgin it to req
    await bodyParser(req);

    // match routes in the route spec
    const matched = this.router.match(context.path);
    if (!matched) {
      this.render404(context);
      return;
    }

    // route is api service
    let route = matched.generate(context.url);
    if (route.isApi) {
      await this.handleAPI(context);
      return;
    }

    if (route.entryName) {
      const afterMatchContext = createAfterMatchContext(
        context,
        route.entryName,
      );

      // only full mode run server hook
      if (this.runMode === RUN_MODE.FULL) {
        await this.runner.afterMatch(afterMatchContext, { onLast: noop });
      }

      if (this.isSend(res)) {
        return;
      }

      const { current, url, status } = afterMatchContext.router;
      // redirect to another url
      if (url) {
        this.redirect(res, url, status);
        return;
      }

      // rewrite to another entry
      if (route.entryName !== current) {
        const matched = this.router.matchEntry(current);
        if (!matched) {
          this.render404(context);
          return;
        }
        route = matched.generate(context.url);
      }
    }

    if (this.frameWebHandler) {
      res.locals = res.locals || {};
      const middlewareContext = createMiddlewareContext(context);
      await this.frameWebHandler(middlewareContext);
      res.locals = {
        ...res.locals,
        ...middlewareContext.response.locals,
      };

      // frameWebHandler has process request
      if (this.isSend(res)) {
        return;
      }
    }

    const renderResult = await this.handleWeb(context, route);
    if (!renderResult) {
      return;
    }

    const { contentStream: responseStream } = renderResult;
    let { content: response } = renderResult;
    if (route.entryName && responseStream) {
      responseStream.pipe(res);
      return;
    }

    if (route.entryName) {
      const afterRenderContext = createAfterRenderContext(
        context,
        response.toString(),
      );

      // only full mode run server hook
      // FIXME: how to run server hook in streaming
      if (this.runMode === RUN_MODE.FULL) {
        await this.runner.afterRender(afterRenderContext, { onLast: noop });
      }

      if (this.isSend(res)) {
        return;
      }

      response = afterRenderContext.template.get();
    }

    res.end(response);
  }

  private isSend(res: ServerResponse) {
    if (res.headersSent) {
      return true;
    }

    if (res.getHeader('Location') && isRedirect(res.statusCode)) {
      res.end();
      return true;
    }

    return false;
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
      // eslint-disable-next-line consistent-return
      const dispatch = (error?: Error) => {
        if (error) {
          return this.onError(context, error);
        }

        const handler = handlers[i++];
        if (!handler) {
          return next();
        }

        try {
          const result = handler(context, dispatch as NextFunction);
          if (isPromise(result)) {
            return result.catch(onError);
          }
        } catch (e) {
          return onError(e as Error);
        }
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
    req.logger = req.logger || this.logger;
    req.metrics = req.metrics || this.metrics;
    let context: ModernServerContext;
    try {
      context = this.createContext(req, res);
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

  private redirect(res: ServerResponse, url: string, status = 302) {
    res.setHeader('Location', url);
    res.statusCode = status;
    res.end();
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
