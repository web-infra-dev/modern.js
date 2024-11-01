import type { CLIPluginAPI } from './api';
import type { Falsy } from './utils';
import type { MaybePromise } from './utils';

type HookOrder = 'pre' | 'post' | 'default';

export type HookDescriptor<T extends (...args: any[]) => any> = {
  handler: T;
  order: HookOrder;
};

export type PluginHook<T extends (...args: any[]) => any> = (
  options: T | HookDescriptor<T>,
) => void;

/**
 * The type of the CLI plugin object.
 */
export type CLIPlugin = {
  /**
   * The name of the plugin, a unique identifier.
   */
  name: string;
  /**
   * The plugins that this plugin depends on.
   */
  usePlugins?: CLIPlugin[];
  /**
   * The setup function of the plugin, which can be an async function.
   * This function is called once when the plugin is initialized.
   * @param api provides the context info, utility functions and lifecycle hooks.
   */
  setup: (api: CLIPluginAPI) => MaybePromise<void>;
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
  getPlugins: () => CLIPlugin[];
  addPlugins: (plugins: Array<CLIPlugin | Falsy>) => void;
};
