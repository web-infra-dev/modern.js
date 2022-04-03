import {
  Setup,
  createManager,
  createWaterfall,
  createWorkflow,
  createContext,
  PluginOptions,
} from '../../../../src';

export type CTX = Record<string, unknown>;
const defaultContext = {};
const CTXContext = createContext<CTX>(defaultContext);
export const useContext = (): CTX => {
  const context = CTXContext.use().value;

  if (!context) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Expected modern context, but got: ${context}`);
  }

  return context;
};

export type Config = Record<string, unknown>;
const defaultConfig = {};
const ConfigContext = createContext<Config>(defaultConfig);
export const useConfig = (): Config => {
  const config = ConfigContext.use().value;

  if (!config) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Expected modern config, but got: ${config}`);
  }

  return config;
};

export type WebpackConfig = Record<string, unknown>;
const defaultWebpackConfig = {};
const WebpackConfigContext = createContext<WebpackConfig>(defaultWebpackConfig);
export const useWebpackConfig = (): WebpackConfig => {
  const webpackConfig = WebpackConfigContext.use().value;

  if (!webpackConfig) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Expected webpack config, but got: ${webpackConfig}`);
  }

  return webpackConfig;
};

export type BabelConfig = Record<string, unknown>;
const defaultBabelConfig = {};
const BabelConfigContext = createContext<BabelConfig>(defaultBabelConfig);
export const useBabelConfig = (): BabelConfig => {
  const babelConfig = BabelConfigContext.use().value;

  if (!babelConfig) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Expected babel config, but got: ${babelConfig}`);
  }

  return babelConfig;
};

// prepare
const prepare = createWaterfall();

// develop
const preDev = createWorkflow();

const postDev = createWorkflow();

// build
const preBuild = createWorkflow();

const postBuild = createWorkflow();

// config
const config = createWaterfall<{
  config: Config;
  webpackConfig: WebpackConfig;
  babelConfig: BabelConfig;
}>();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExternalProgress {}

// main process
const lifecircle = {
  prepare,
  config,

  preDev,
  postDev,

  preBuild,
  postBuild,
};

export type TestHooks = ExternalProgress & typeof lifecircle;

export const main = createManager<TestHooks>(lifecircle);

export type TestPlugin = PluginOptions<TestHooks, Setup<TestHooks>>;

export const { createPlugin } = main;

export const { isPlugin } = main;

export const { usePlugin } = main;

export const initPlugins = main.init;

export const { registerHook } = main;

export const { useRunner } = main;

export const develop = (context: CTX) => {
  const runner = main.init();

  main.run(() => {
    CTXContext.set(context);
  });
  runner.prepare();

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { config, webpackConfig, babelConfig } = runner.config({
    config: defaultConfig,
    webpackConfig: defaultWebpackConfig,
    babelConfig: defaultBabelConfig,
  });

  main.run(() => {
    ConfigContext.set(config);
    WebpackConfigContext.set(webpackConfig);
    BabelConfigContext.set(babelConfig);
  });
  runner.preDev();
  runner.postDev();
};

export const build = (context: CTX) => {
  const runner = main.init();

  main.run(() => {
    CTXContext.set(context);
  });
  runner.prepare();

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { config, webpackConfig, babelConfig } = runner.config({
    config: defaultConfig,
    webpackConfig: defaultWebpackConfig,
    babelConfig: defaultBabelConfig,
  });

  main.run(() => {
    ConfigContext.set(config);
    WebpackConfigContext.set(webpackConfig);
    BabelConfigContext.set(babelConfig);
  });

  runner.preBuild();

  runner.postBuild();
};
