import {
  createAsyncManager,
  createAsyncPipeline,
  createAsyncWaterfall,
  createContext,
  createParallelWorkflow,
} from '@modern-js/plugin';
import type {
  AppContext,
  ConfigContext,
  ServerHooks,
  ServerPluginAPI,
  CliConfig,
  ServerHookRunner,
  ServerPlugin,
  ServerConfig,
  ServerConfigContext,
} from './types';
import { loadConfig } from './utils/serverConfig';

export interface PluginManagerOptions {
  cliConfig: CliConfig;

  appContext: AppContext;

  plugins?: ServerPlugin[];

  serverConfig?: ServerConfig;
}

export class PluginManager {
  #appContext: AppContext;

  #plugins: ServerPlugin[];

  #options: PluginManagerOptions;

  #configContext: ConfigContext = createContext<any>({});

  #serverConfigCtx: ServerConfigContext = createContext<any>({});

  constructor(options: PluginManagerOptions) {
    this.#appContext = options.appContext;
    this.#serverConfigCtx = createContext(options.serverConfig || {});
    this.#options = options;
    this.#plugins = options.plugins || [];
  }

  async init() {
    const coreManager = this.#createCoreManager();

    const runner = await coreManager.init();

    await this.#initConfigContext(runner);

    return runner;
  }

  addPlugins(plugins: ServerPlugin[]) {
    this.#plugins.push(...plugins);
  }

  #createCoreManager() {
    const hooks: ServerHooks = {
      config: createAsyncWaterfall(),
      prepare: createAsyncWaterfall(),
      reset: createParallelWorkflow(),

      prepareWebServer: createAsyncPipeline(),
      fallback: createParallelWorkflow(),
      prepareApiServer: createAsyncPipeline(),
      afterMatch: createAsyncPipeline(),
      afterRender: createAsyncPipeline(),
      afterStreamingRender: createAsyncPipeline(),
    };

    const pluginApi: ServerPluginAPI = {
      useConfigContext: () => this.#configContext.use().value,
      uesServerConfig: () => this.#serverConfigCtx.use().value,
      useAppContext: () => this.#appContext.use().value,
      setAppContext: c => this.#appContext.set(c),
    };

    const coreManager = createAsyncManager(hooks, pluginApi);

    this.#plugins.push(...(this.#options.serverConfig?.plugins || []));

    this.#plugins.forEach(p => {
      const plugin = coreManager.createPlugin(p.setup, p);
      coreManager.usePlugin(plugin);
    });

    return coreManager;
  }

  async #initConfigContext(runner: ServerHookRunner) {
    const { serverConfig: serverRuntimeConfig, cliConfig } = this.#options;

    const finalServerConfig = await runner.config(serverRuntimeConfig || {});

    this.#serverConfigCtx.set(finalServerConfig);

    const finalConfig = loadConfig({
      cliConfig,
      serverConfig: finalServerConfig as any,
      resolvedConfigPath: '',
    });

    this.#configContext.set(finalConfig);
  }
}
