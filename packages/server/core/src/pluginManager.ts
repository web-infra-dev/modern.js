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
} from './types';
import { loadConfig } from './utils';

export interface PluginManagerOptions {
  cliConfig: CliConfig;

  appContext: AppContext;

  plugins?: ServerPlugin[];

  serverConfig?: ServerConfig;
}

export class PluginManager {
  #appContext: AppContext;

  #plugins: ServerPlugin[] = [];

  #options: PluginManagerOptions;

  #configContext: ConfigContext = createContext<any>({});

  constructor(options: PluginManagerOptions) {
    this.#appContext = options.appContext;
    this.#configContext = createContext(options.serverConfig || {});
    this.#options = options;
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
      useAppContext: () => this.#appContext.use().value,
      setAppContext: c => this.#appContext.set(c),
    };

    const coreManager = createAsyncManager(hooks, pluginApi);

    this.addPlugins(this.#options.serverConfig?.plugins || []);

    this.#plugins.forEach(p => {
      const plugin = coreManager.createPlugin(p.setup, p);
      coreManager.usePlugin(plugin);
    });

    return coreManager;
  }

  async #initConfigContext(runner: ServerHookRunner) {
    const { serverConfig, cliConfig } = this.#options;
    const mergedConfig = loadConfig({
      cliConfig,
      serverConfig: serverConfig || {},
    });

    const finalServerConfig = await runner.config(mergedConfig);

    this.#configContext.set(finalServerConfig);
  }
}
