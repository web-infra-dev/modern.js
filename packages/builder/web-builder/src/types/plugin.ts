import { WebBuilderConfig } from './config';
import type { WebBuilderContext } from './context';
import type { WebpackChain, WebpackConfig } from './dependencies';

export type PluginStore = {
  plugins: WebBuilderPlugin[];
  addPlugins: (plugins: WebBuilderPlugin[]) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type ModifyWebpackChainFn = (chain: WebpackChain) => Promise<void>;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
) => Promise<WebpackConfig | void>;

export type ModifyBuilderConfigFn = (
  config: WebBuilderConfig,
) => Promise<WebBuilderConfig | void>;

export type WebBuilderPluginAPI = {
  context: WebBuilderContext;
  isPluginExists: PluginStore['isPluginExists'];
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
  modifyBuilderConfig: (fn: ModifyBuilderConfigFn) => void;
};

export type WebBuilderPlugin = {
  name: string;
  setup: (api: WebBuilderPluginAPI) => void;
};
