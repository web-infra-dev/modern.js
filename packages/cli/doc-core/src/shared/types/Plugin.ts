import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { PluggableList } from 'unified';
import { DocConfig } from '.';

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
   * Inject global components.
   */
  globalUIComponents?: string[];
  /**
   * Modify doc config.
   */
  config?: (config: DocConfig) => DocConfig | Promise<DocConfig>;
  /**
   * Callback before build
   */
  beforeBuild?: (config: DocConfig, isProd: boolean) => Promise<void>;
  /**
   * Callback after build
   */
  afterBuild?: (config: DocConfig, isProd: boolean) => Promise<void>;
}
