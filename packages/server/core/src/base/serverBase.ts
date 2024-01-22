import path from 'node:path';
import {
  INTERNAL_SERVER_PLUGINS,
  OUTPUT_CONFIG_FILE,
  SHARED_DIR,
  createLogger,
  dotenv,
  dotenvExpand,
  ensureAbsolutePath,
  fs,
  isWebOnly,
} from '@modern-js/utils';
import { ISAppContext } from '@modern-js/types';
import { ServerOptions } from '@config/index';
import { Hono } from 'hono';
import {
  APIServerStartInput,
  AppContext,
  ConfigContext,
  ServerConfig,
  loadPlugins,
  serverManager,
} from '../core';
import { defaultMetrics } from './libs/default';
import {
  ConfWithBFF,
  HonoNodeEnv,
  ServerBaseOptions,
  ServerHookRunner,
} from './types';
import { debug } from './utils';
import {
  getServerConfigPath,
  loadConfig,
  requireConfig,
} from './libs/loadConfig';
import { httpCallBack2HonoMid } from './adapters/hono';
import {
  createErrorHtml,
  getRuntimeEnv,
  mergeExtension,
  createMiddlewareCollecter,
} from './libs/utils';

declare module '@modern-js/types' {
  interface ISAppContext {
    serverBase?: ServerBase;
  }
}

export class ServerBase {
  public options: ServerBaseOptions;

  public runner!: ServerHookRunner;

  private workDir: string;

  private distDir: string;

  private app: Hono<HonoNodeEnv>;

  private serverConfig: ServerConfig = {};

  private conf: ServerOptions;

  constructor(options: ServerBaseOptions) {
    options.logger = options.logger || createLogger({ level: 'warn' });
    options.metrics = options.metrics || defaultMetrics;
    this.options = options;

    this.app = new Hono<HonoNodeEnv>();
    this.serverConfig = {};
    const { pwd, config } = options;
    this.distDir = path.resolve(pwd, config.output.path || 'dist');
    this.workDir = this.distDir;
    this.conf = config;

    this.app.notFound(c => {
      return c.html(createErrorHtml(404), 404);
    });

    this.app.onError((_err, c) => {
      // TODO: repoter error.
      return c.html(createErrorHtml(500), 500);
    });
  }

  /**
   * 初始化顺序
   * - 读取 .env.{process.env.MODERN_ENV} 文件，加载环境变量
   * - 获取 server runtime config
   * - 设置 context
   * - 创建 hooksRunner
   * - 合并插件，内置插件和 serverConfig 中配置的插件
   * - 执行 config hook
   * - 获取最终的配置
   * - 设置配置到 context
   * - 初始化 server
   * - 执行 prepare hook
   * - 执行 server init
   */
  async init(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { disableHttpServer = false }: { disableHttpServer?: boolean } = {
      disableHttpServer: false,
    },
  ) {
    const { options } = this;

    await this.loadServerEnv(options);

    this.initServerConfig(options);

    await this.injectContext(this.runner, options);

    // initialize server runner
    this.runner = await this.createHookRunner();

    // init config and execute config hook
    await this.initConfig(this.runner, options);

    await this.injectContext(this.runner, options);

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await this.runner.prepare();

    return this;
  }

  async prepareFrameHandler(options?: { onlyApi: boolean; onlyWeb: boolean }) {
    const { runner } = this;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onlyApi, onlyWeb } = options || {};

    // server hook, gather plugin inject
    const { getMiddlewares, ...collector } = createMiddlewareCollecter();

    await runner.gather(collector);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { api: pluginAPIExt, web: pluginWebExt } = getMiddlewares();

    if (!onlyWeb) {
      const apiExtension = mergeExtension(pluginAPIExt);
      await this.runPrepareApiServer(apiExtension);
    }
  }

  private async runPrepareApiServer(extension: APIServerStartInput['config']) {
    const runtimeEnv = getRuntimeEnv();
    if (runtimeEnv !== 'node') {
      return;
    }

    const { workDir, runner, conf } = this;
    const { bff } = conf as ConfWithBFF;
    const prefix = bff?.prefix || '/api';
    const webOnly = await isWebOnly();
    if (webOnly && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line consistent-return
      return this.get(
        `${prefix}/*`,
        // TODO: need to refractor bff plugin
        // @ts-expect-error
        httpCallBack2HonoMid((req, res) => {
          res.setHeader('Content-Type', 'text/plain');
          res.end(JSON.stringify(''));
        }),
      );
    }
    const middleware = await runner.prepareApiServer(
      {
        pwd: workDir,
        config: extension,
        prefix: Array.isArray(prefix) ? prefix[0] : prefix,
        httpMethodDecider: bff?.httpMethodDecider,
        // render: this.render.bind(this),
      },
      { onLast: () => null as any },
    );

    // TODO: need to refractor bff plugin
    // @ts-expect-error
    // eslint-disable-next-line consistent-return
    return this.app.all(`${prefix}/*`, httpCallBack2HonoMid(middleware));
  }

  private async createHookRunner() {
    // clear server manager every create time
    serverManager.clear();

    const { options } = this;
    // TODO: 确认下这里是不是可以不从 options 中取插件，而是从 config 中取和过滤
    const {
      internalPlugins = INTERNAL_SERVER_PLUGINS,
      pwd,
      plugins = [],
    } = options;
    const serverPlugins = this.serverConfig.plugins || [];
    // server app context for serve plugin
    const loadedPlugins = loadPlugins(pwd, [...serverPlugins, ...plugins], {
      internalPlugins,
    });

    debug('plugins', loadedPlugins);
    loadedPlugins.forEach(p => {
      serverManager.usePlugin(p);
    });

    // create runner
    const hooksRunner = await serverManager.init();

    return hooksRunner;
  }

  private initServerConfig(options: ServerBaseOptions) {
    const { pwd, serverConfigFile } = options;
    const distDirectory = [pwd, options.config.output.path || 'dist'].join('/');
    const serverConfigPath = getServerConfigPath(
      distDirectory,
      serverConfigFile,
    );
    const serverConfig = requireConfig(serverConfigPath);
    this.serverConfig = serverConfig;
  }

  private async loadServerEnv(options: ServerBaseOptions) {
    const { pwd: appDirectory } = options;
    const serverEnv = process.env.MODERN_ENV;
    const defaultEnvPath = path.resolve(appDirectory, `.env`);
    const serverEnvPath = path.resolve(appDirectory, `.env.${serverEnv}`);
    for (const envPath of [serverEnvPath, defaultEnvPath]) {
      if (
        (await fs.pathExists(envPath)) &&
        !(await fs.stat(envPath)).isDirectory()
      ) {
        const envConfig = dotenv.config({ path: envPath });
        dotenvExpand(envConfig);
      }
    }
  }

  private async injectContext(
    runner: ServerHookRunner,
    options: ServerBaseOptions,
  ) {
    const appContext = this.initAppContext();
    const { config, pwd } = options;

    ConfigContext.set(config);
    AppContext.set({
      ...appContext,
      serverBase: this,
      distDirectory: path.join(pwd, config.output.path || 'dist'),
    });
  }

  private initAppContext(): ISAppContext {
    const { options } = this;
    const { pwd: appDirectory, plugins = [], config, appContext } = options;
    const serverPlugins = plugins.map(p => ({
      server: p,
    }));

    return {
      appDirectory,
      apiDirectory: appContext?.apiDirectory,
      lambdaDirectory: appContext?.lambdaDirectory,
      sharedDirectory:
        appContext?.sharedDirectory || path.resolve(appDirectory, SHARED_DIR),
      distDirectory: path.join(appDirectory, config.output.path || 'dist'),
      plugins: serverPlugins,
    };
  }

  /**
   * Execute config hooks
   * @param runner
   * @param options
   */
  private runConfigHook(runner: ServerHookRunner, serverConfig: ServerConfig) {
    const newServerConfig = runner.config(serverConfig || {});
    return newServerConfig;
  }

  private async initConfig(
    runner: ServerHookRunner,
    options: ServerBaseOptions,
  ) {
    const { pwd, config } = options;

    const { serverConfig } = this;

    const finalServerConfig = this.runConfigHook(runner, serverConfig);

    const resolvedConfigPath = ensureAbsolutePath(
      pwd,
      path.join(config.output.path || 'dist', OUTPUT_CONFIG_FILE),
    );

    options.config = loadConfig({
      cliConfig: config,
      serverConfig: finalServerConfig,
      resolvedConfigPath,
    });
  }

  get use() {
    return this.app.use;
  }

  get get() {
    return this.app.get;
  }

  get post() {
    return this.app.post;
  }

  get put() {
    return this.app.put;
  }

  get delete() {
    return this.app.delete;
  }

  get patch() {
    return this.app.patch;
  }

  get handle() {
    return this.app.fetch;
  }

  get request() {
    return this.app.request;
  }
}
