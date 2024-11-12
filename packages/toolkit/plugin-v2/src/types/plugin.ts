import type { PluginHook } from './hooks';
import type { Falsy } from './utils';
import type { MaybePromise } from './utils';

export type TransformFunction<T> = (arg: T) => T | Promise<T>;

export type Plugin<PluginAPI = {}> = {
  /**
   * The name of the plugin, a unique identifier.
   */
  name: string;
  /**
   * The plugins that this plugin depends on.
   */
  usePlugins?: Plugin<PluginAPI>[];
  /**
   * The plugins add new hooks to the plugin manager.
   */
  registryHooks?: Record<string, PluginHook<(...args: any[]) => any>>;
  /**
   * The setup function of the plugin, which can be an async function.
   * This function is called once when the plugin is initialized.
   * @param api provides the context info, utility functions and lifecycle hooks.
   */
  setup: (api: PluginAPI) => MaybePromise<void>;
  /**
   * Declare the names of pre-plugins, which will be executed before the current plugin.
   */
  pre?: string[];
  /**
   * Declare the names of post-plugins, which will be executed after the current plugin.
   */
  post?: string[];
};

export type PluginManager = {
  getPlugins: () => Plugin[];
  addPlugins: (plugins: Array<Plugin | Falsy>) => void;
};
