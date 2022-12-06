import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { PluggableList } from 'unified';

export interface DocPlugin {
  /**
   * Name of the plugin.
   */
  name: string;
  /**
   * Global style
   */
  globalStyles?: string;
  /**
   * Resolve.alias in build tool config.
   */
  alias?: Record<string, string>;
  /**
   * Define in build tool config.
   */
  define?: Record<string, string>;
  /**
   * Markdown options.
   */
  markdown?: {
    remarkPlugins?: PluggableList;
    rehypePlugins?: PluggableList;
  };
  /**
   * Builder config.
   */
  builderConfig?: BuilderConfig;
  /**
   * To ensure hmr works properly, we need to watch some files.
   */
  watchFiles?: string[];
  /**
   * TODO:Path list of global components.
   */
  globalUIComponents?: string[];
}
